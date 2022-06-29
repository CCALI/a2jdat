const {getTemplateOverlay} = require('@caliorg/a2jdeps/pdf/assemble')
const ssr = require('done-ssr')
const fs = require('fs')
const he = require('he')
const hummus = require('muhammara')
const path = require('path')
const through = require('through2')
const files = require('../util/files')
const uuid = require('uuid')
const cheerio = require('cheerio')
const {overlayer} = require('../pdf/overlayer')
const {storage} = require('../pdf/storage')
const debug = require('debug')('A2J:assemble')
const wkhtmltopdf = require('wkhtmltopdf')
const { parse } = require('node-html-parser')
const evalAuthorCondition = require('@caliorg/a2jdeps/utils/eval-author-condition')
const templates = require('../routes/templates')
const {data} = require('../util/data')
const getCssBundlePath = require('../util/get-css-bundle-path')
const paths = require('../util/paths')

const configPath = path.join(__dirname, '..', '..', 'package.json!npm')
debug('SSR configPath', configPath)

const render = ssr({
  main: 'a2jdat/server.stache!done-autorender',
  config: configPath
}, {
  // this allows for debugging in Node --inspect-brk
  // setting a max of 20 seconds before done-ssr times out
  // this does not prevent done-ssr from finishing earlier if
  // the render is complete.
  //
  timeout: 20000
})

const config = getConfig()
let configPdfOptions = {}
if (config) {
  setWkhtmltopdfCommand(config)
  configPdfOptions = getConfigPdfOptions(config)
}

function setDownloadHeaders (res, filename) {
  res.set({
    status: 201,
    'Content-Type': 'application/pdf',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': `attachment; filename=${filename}`
  })
}

function checkPresenceOf (req, res, next) {
  const { answers, fileDataUrl, guideId } = req.body

  const answersError = getErrorForAnswers(answers)
  if (answersError) {
    return res.status(400)
      .send(answersError)
  }

  if (!guideId && !fileDataUrl) {
    return res.status(400)
      .send('You must provide either guideId or fileDataUrl')
  }

  next()
}

function combineHtmlFiles (htmlFiles) {
  const [firstHtmlFile, ...otherHtmlFiles] = htmlFiles

  if (otherHtmlFiles.length > 0) {
    const firstHtmlFileParsed = parse(firstHtmlFile)
    const firstHtmlFileBody = firstHtmlFileParsed.querySelector('body')

    otherHtmlFiles.map(htmlFile => {
      return parseBodyHTML(htmlFile)
    }).forEach(childNodes => {
      childNodes.forEach(childNode => {
        firstHtmlFileBody.appendChild(childNode)
      })
    })

    return firstHtmlFileParsed.toString()
  }

  return firstHtmlFile
}

async function combinePdfFiles (pdfFiles) {
  const [firstPdf, ...otherPdfs] = pdfFiles

  if (otherPdfs.length > 0) {
    const writer = hummus.createWriterToModify(firstPdf)
    otherPdfs.forEach(pdf => {
      writer.appendPDFPagesFromPDF(pdf)
    })
    writer.end()
  }

  return firstPdf
}

function createHtmlForPdfTemplate (template) {
  return `
    <!doctype html>
    <html>
      <head><title>A2J document preview for “${template.title}”</title></head>
      <body><p>A preview for “${template.title}” could not be generated because it is a PDF.</p></body>
    </html>
  `
}

async function createHtmlForTextTemplate (request) {
  const renderedWebpage = await getHtmlForRichText(request)
  // inline the css
  const inlineStyles = await createInlineStyles(request.__cssBundlePath)
  return renderedWebpage.replace('<style></style>', inlineStyles)
}

async function createPdfForTextTemplate (request, pdfOptions) {
  const renderedWebpage = await createHtmlForTextTemplate(request)
  return getPdfForHtml(renderedWebpage, pdfOptions)
}

function deleteFile (filepath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filepath, error => error ? reject(error) : resolve())
  })
}

function getDoneSsrRequestObject (answers, fileDataUrl, renderTemplateFootersAndHeaders, template, req) {
  // resolve any a2j-variable tags with their answers
  template.header = parseHeaderFooterHTML(getHeaderFooterNode(template.header), answers)
  template.footer = parseHeaderFooterHTML(getHeaderFooterNode(template.footer), answers)

  // make unique request here for each templateId
  const newBody = Object.assign({}, req.body, {
    templateId: template.templateId,
    header: template.header,
    hideHeaderOnFirstPage: template.hideHeaderOnFirstPage,
    footer: template.footer,
    hideFooterOnFirstPage: template.hideFooterOnFirstPage,
    fileDataUrl,
    renderTemplateFootersAndHeaders
  })

  return Object.assign({}, {
    url: req.url,
    protocol: req.protocol,
    originalUrl: req.originalUrl,
    get: req.get,
    headers: req.headers,
    body: newBody,
    connection: req.connection,
    __cssBundlePath: getCssBundlePath()
  })
}

function getErrorForAnswers (answers) {
  if (answers === undefined) {
    return 'You must provide the answers property in the request body'
  }
  try {
    const parsed = JSON.parse(answers)
    if (parsed instanceof Object) {
      return ''
    } else {
      return 'Answers must be a valid stringified JSON object'
    }
  } catch (error) {
    return `Failed to parse answers with error: ${error}`
  }
}

function getHtmlForRichText (request) {
  const webpageStream = render(request)
  return new Promise((resolve, reject) => {
    webpageStream.pipe(through(buffer => {
      const html = buffer.toString()
      resolve(he.decode(html))
    }))
    webpageStream.on('error', error => reject(error))
  })
}

function getPdfForHtml (html, pdfOptions) {
  return wkhtmltopdf(html, pdfOptions)
}

async function getSingleTemplate (templateId, fileDataUrl) {
  return paths.getTemplatePath({ username: '', guideID: '', templateId, fileDataUrl })
  .then((path) => files.readJSON({ path }))
}

async function getTemplatesForGuide (username, guideId, fileDataUrl) {
  const templateIndex = await templates.getTemplatesJSON({ username, guideId, fileDataUrl })
  // if guideId not defined, we are in standalone viewer/dat assembly using fileDataUrl
  // set guideId to the local templates.json value
  if (fileDataUrl && !guideId) {
    guideId = templateIndex.guideId
  }
  const templateIds = templateIndex.templateIds
  const templatesPromises = templateIds
  .map(templateId => paths
      .getTemplatePath({guideId, templateId, username, fileDataUrl})
      .then(path => files.readJSON({path}))
    )

  const isActive = template =>
    template.active === 'true' || template.active === true

  return Promise.all(templatesPromises)
    .then(templates => templates.filter(isActive))
}

function getTemporaryPdfFilepath () {
  return path.join(storage.getTemporaryDirectory(), `test-${uuid.v4()}.pdf`)
}

async function getVariablesForGuide (username, guideId, fileDataUrl) {
  const xml = await data.getGuideXml(username, guideId, fileDataUrl)
  if (!xml) {
    return {}
  }
  const variables = getXmlVariables(xml)
  return variables.reduce((map, variable) => {
    map[variable.name.toLowerCase()] = variable
    return map
  }, {})
}

async function renderHtmlForTemplates (templates, req, fileDataUrl, answers) {
  const htmlFiles = await Promise.all(templates.map(template => {
    const isPdf = isPdfTemplate(template)
    if (isPdf) {
      return createHtmlForPdfTemplate(template)
    }
    const donessrRequestObject = getDoneSsrRequestObject(answers, fileDataUrl, true, template, req)
    return createHtmlForTextTemplate(donessrRequestObject)
  }))

  return combineHtmlFiles(htmlFiles)
}

async function renderPdfForPdfTemplates (username, templates, variables, answers, fileDataUrl) {
  const pdfFiles = await Promise.all(templates.map(async template => {
    const filepath = await storage.duplicateTemplatePdf(username, template.guideId, template.templateId, fileDataUrl)
    const overlay = getTemplateOverlay(template, variables, answers)
    await overlayer.forkWithOverlay(filepath, overlay)
    return filepath
  }))

  return combinePdfFiles(pdfFiles)
}

async function renderPdfForTextTemplates (templates, req, fileDataUrl, answers) {
  const pdfFiles = await Promise.all(templates.map(template => {
    const donessrRequestObject = getDoneSsrRequestObject(answers, fileDataUrl, false, template, req)
    const reqPdfOptions = Object.assign({}, getRequestPdfOptions(donessrRequestObject))
    const pdfOptions = Object.assign({},
      reqPdfOptions,
      configPdfOptions,
      {
        'header-spacing': 5,
        'footer-spacing': 5,
        'margin-top': 20
      }
    )

    return createPdfForTextTemplate(donessrRequestObject, pdfOptions).then(pdfStream => {
      const temporaryPath = getTemporaryPdfFilepath()
      const fileStream = fs.createWriteStream(temporaryPath)
      return new Promise((resolve, reject) => {
        pdfStream.on('error', error => reject(error))
        fileStream.on('finish', () => resolve(temporaryPath))
        fileStream.on('error', error => reject(error))
        pdfStream.pipe(fileStream)
      })
    })
  }))

  return combinePdfFiles(pdfFiles)
}

function uniq (list) {
  return list.reduce((list, item) =>
    list.includes(item) ? list : [...list, item]
  , [])
}

function mergeGuideVariableWithAnswers (variables, answers) {
  const allUniqueKeys = uniq([
    ...Object.keys(variables),
    ...Object.keys(answers)
  ])
  return allUniqueKeys.reduce((vars, key) => {
    const union = Object.assign({}, answers[key] || {}, variables[key] || {})
    if (union.name) {
      const {name, type, repeating} = union
      vars[name.toLowerCase()] = {type, repeating, name}
    }
    return vars
  }, {})
}

const isPdfTemplate = template =>
  template.rootNode && template.rootNode.tag === 'a2j-pdf'

function filterTemplatesByCondition (answers) {
  return function (template) {
    const {state} = template.rootNode
    // legacy text templates have no state, render by default
    if (!state || !state.hasConditionalLogic) {
      return true
    }
    const shouldBeIncluded = evalAuthorCondition(Object.assign(
      state,
      {answers}
    ))
    return shouldBeIncluded
  }
}

function segmentTextAndPdfTemplates (templates) {
  const [firstTemplate, ...otherTemplates] = templates
  const segments = [{
    isPdf: isPdfTemplate(firstTemplate),
    templates: [firstTemplate]
  }]

  otherTemplates.forEach(template => {
    const isPdf = isPdfTemplate(template)
    const currentSegment = segments[segments.length - 1]
    const shouldAddToSegment = isPdf === currentSegment.isPdf
    if (shouldAddToSegment) {
      currentSegment.templates.push(template)
      return
    }

    segments.push({isPdf, templates: [template]})
  })

  return segments
}

function getXmlVariables (xml) {
  const $ = cheerio.load(xml)
  const answers = []
  $('ANSWERS > ANSWER').each((index, elem) => {
    const attr = attributeName => $(elem).attr(attributeName.toUpperCase())
    const repeating = attr('repeating')
    const answer = {
      name: attr('name'),
      type: attr('type'),
      repeating: repeating === '1' || repeating === 'true',
      comment: attr('comment') || ''
    }
    answers.push(answer)
  })
  return answers
}

function getRequestPdfOptions (req) {
  const url = req.protocol + '://' + req.get('host') + req.originalUrl
  const headerFooterUrl = url + '/header-footer?content='

  const {
    header,
    hideHeaderOnFirstPage,
    footer,
    hideFooterOnFirstPage
  } = req.body

  const pdfOptions = {}
  pdfOptions['header-html'] = `${headerFooterUrl}${encodeURIComponent(header)}&hideOnFirstPage=true`

  if (header) {
    const h = encodeURIComponent(header)
    const hofp = encodeURIComponent(hideHeaderOnFirstPage)

    pdfOptions['header-html'] = `${headerFooterUrl}${h}&hideOnFirstPage=${hofp}`
  }

  if (footer) {
    const f = encodeURIComponent(footer)
    const hofp = encodeURIComponent(hideFooterOnFirstPage)

    pdfOptions['footer-html'] = `${headerFooterUrl}${f}&hideOnFirstPage=${hofp}`
  }

  return pdfOptions
}

function getConfig () {
  let config
  const version = process.env.npm_package_version
  const configPath = path.join(__dirname, '..', '..', '..', 'config.json')
  console.log('Starting A2J DAT, version: ' + version + '\n')
  try {
    fs.accessSync(configPath, fs.constants.R_OK)
    debug('can read config.json from ', configPath)
    config = require('../util/config')
  } catch (err) {
    console.error('config.json file not found or unreadable')
    debug('expected config.json in ', configPath)
  }
  return config
}

function setWkhtmltopdfCommand (config) {
  wkhtmltopdf.command = config.get('WKHTMLTOPDF_PATH')
  debug('Setting path to wkhtmltopdf binary: ', wkhtmltopdf.command)
}

function getConfigPdfOptions (config) {
  const configPdfOptions = {}
  const dpiDefault = 300
  const zoomDefault = 1.0

  configPdfOptions.dpi = parseFloat(config.get('WKHTMLTOPDF_DPI')) || dpiDefault
  configPdfOptions.zoom = parseFloat(config.get('WKHTMLTOPDF_ZOOM')) || zoomDefault

  debug('wkhtmltopdf zoom: ', configPdfOptions.zoom)
  debug('wkhtmltopdf dpi: ', configPdfOptions.dpi)

  return configPdfOptions
}

function getHeaderFooterNode (headerOrFooterHtml) {
  return parse(headerOrFooterHtml)
}

function parseBodyHTML (html) {
  const parsed = parse(html)

  const bodyChildNodes = parsed.querySelectorAll('body').map((bodyNode) => {
    return bodyNode.childNodes
  })

  return bodyChildNodes.reduce((previousValue, currentValue) => {
    return [
      ...previousValue,
      ...currentValue
    ]
  }, [])
}

function parseHeaderFooterHTML (headerFooterNode, answers) {
  if (answers) {
    headerFooterNode.querySelectorAll('a2j-variable').forEach((variableNode) => {
      // <a2j-variable name="Client First Name TE"></a2j-variable>
      const varName = variableNode.rawAttrs.split('"')[1].toLowerCase() // middle result of 3 parts
      const answerValue = answers[varName] && answers[varName].values[1] // var loops not allowed, 0th answer is null

      // update textContent with answer
      // <a2j-variable name="Client First Name TE">Miguel</a2j-variable>
      if (answerValue) {
        variableNode.set_content(answerValue)
      }
    })
  }

  // convert back to html
  return headerFooterNode.toString()
}

async function createInlineStyles (path) {
  const bundleCSS = await files.readFile({ path })
  const inlineStyles = `<style>\n${bundleCSS}\n</style>`
  return inlineStyles
}

module.exports = {
  checkPresenceOf,
  combineHtmlFiles,
  combinePdfFiles,
  setDownloadHeaders,
  deleteFile,
  getErrorForAnswers,
  getSingleTemplate,
  getTemplatesForGuide,
  getTemporaryPdfFilepath,
  getVariablesForGuide,
  mergeGuideVariableWithAnswers,
  filterTemplatesByCondition,
  segmentTextAndPdfTemplates,
  getXmlVariables,
  getRequestPdfOptions,
  getConfig,
  getConfigPdfOptions,
  setWkhtmltopdfCommand,
  getHeaderFooterNode,
  parseHeaderFooterHTML,
  renderHtmlForTemplates,
  renderPdfForPdfTemplates,
  renderPdfForTextTemplates,
  createInlineStyles
}
