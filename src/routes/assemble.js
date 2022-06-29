const url = require('url')
const feathers = require('feathers')
const filenamify = require('../util/pdf-filename')
const forwardCookies = require('../util/cookies').forwardCookies

const paths = require('../util/paths')
const user = require('../util/user')

const {
  checkPresenceOf,
  combinePdfFiles,
  setDownloadHeaders,
  mergeGuideVariableWithAnswers,
  filterTemplatesByCondition,
  segmentTextAndPdfTemplates,
  getSingleTemplate,
  getTemplatesForGuide,
  getVariablesForGuide,
  renderPdfForPdfTemplates,
  renderPdfForTextTemplates
} = require('./assemble-utils')

const debug = require('debug')('A2J:assemble')
const router = feathers.Router()

router.post('/', checkPresenceOf, (req, res) => {
  assemble(req, res).catch(error => {
    debug('/assemble error:', error)
    res.status(500).json({
      ok: false,
      error: error.message
    })
  })
})

async function assemble (req, res) {
  debug('Request body:', req.body)
  const cookieHeader = req.headers.cookie
  let { fileDataUrl } = req.body
  const { isTestAssemble, guideTitle, guideId, templateId, answers: answersJson } = req.body
  const downloadName = isTestAssemble ? filenamify(guideTitle + ' test assemble') : filenamify(guideTitle)

  // if there is no fileDataUrl, we are in Author preview and need to build it
  // TODO: this is a middle step until Author, Viewer, and DAT are separate apps
  // and username/guideId will no longer be needed to build paths
  let username = ''
  if (!fileDataUrl) {
    username = await user.getCurrentUser({cookieHeader})
    fileDataUrl = paths.getGuideDirPath(username, guideId, fileDataUrl)
  }

  const answers = JSON.parse(answersJson)
  const guideVariables = await getVariablesForGuide(username, guideId, fileDataUrl)
  const variables = mergeGuideVariableWithAnswers(guideVariables, answers)

  const segments = await (async () => {
    // if single template, this is Author Test Assemble
    const isSingleTemplateAssemble = !!templateId
    if (isSingleTemplateAssemble) {
      const template = await getSingleTemplate(templateId, fileDataUrl)
      return [{
        isPdf: false,
        templates: [template]
      }]
    } else {
      const allTemplates = await getTemplatesForGuide(username, guideId, fileDataUrl)
      const isTemplateLogical = filterTemplatesByCondition(answers)
      const templates = allTemplates.filter(isTemplateLogical)
      return segmentTextAndPdfTemplates(templates)
    }
  })()

  const pdfFiles = await Promise.all(segments.map(
    ({isPdf, templates}) => {
      if (isPdf) {
        return renderPdfForPdfTemplates(username, templates, variables, answers, fileDataUrl)
      }

      return renderPdfForTextTemplates(templates, req, fileDataUrl, answers)
    }
  )).catch(error => {
    debug('Assemble error:', error)
    throw error
  })

  const pdf = await combinePdfFiles(pdfFiles)
  setDownloadHeaders(res, downloadName)
  return new Promise((resolve, reject) => {
    res.sendFile(pdf, error => {
      if (error) {
        debug('Send error:', error)
        return reject(error)
      }
      return resolve()
    })
  })
}

router.get('/header-footer', forwardCookies, function (req, res) {
  var query = url.parse(req.originalUrl, true).query

  if (query.page === '1' && query.hideOnFirstPage === 'true') {
    res.status(200).send('<!DOCTYPE html>')
  } else {
    res.status(200).send('<!DOCTYPE html>' + query.content)
  }
})

module.exports = router
