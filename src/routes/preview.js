const debug = require('debug')('A2J:assemble')
const feathers = require('feathers')
const paths = require('../util/paths')
const filenamify = require('../util/pdf-filename')
const user = require('../util/user')
const {
  checkPresenceOf,
  filterTemplatesByCondition,
  getSingleTemplate,
  getTemplatesForGuide,
  renderHtmlForTemplates
} = require('./assemble-utils')

const router = feathers.Router()

router.post('/', checkPresenceOf, (req, res) => {
  preview(req, res).catch(error => {
    debug('/preview error:', error)
    res.status(500).json({
      error: error.message,
      ok: false
    })
  })
})

async function preview (req, res) {
  debug('Request body:', req.body)
  const cookieHeader = req.headers.cookie
  let { fileDataUrl } = req.body
  const { isTestAssemble, guideTitle, guideId, templateId, answers: answersJson } = req.body
  const downloadName = isTestAssemble ? filenamify(guideTitle + ' test assemble') : filenamify(guideTitle)

  // if there is no fileDataUrl, we are in Author preview and need to build it
  // TODO: this is a middle step until Author, Viewer, and DAT are separate apps
  // and username/guideId will no longer be needed to build paths
  const username = fileDataUrl ? '' : await user.getCurrentUser({ cookieHeader })
  if (!fileDataUrl) {
    fileDataUrl = paths.getGuideDirPath(username, guideId, fileDataUrl)
  }

  const answers = JSON.parse(answersJson)

  const previewHtml = await (async () => {
    // if single template, this is Author Test Assemble
    const isSingleTemplateAssemble = !!templateId

    const activeTemplates = isSingleTemplateAssemble ? [await getSingleTemplate(templateId, fileDataUrl)] : await getTemplatesForGuide(username, guideId, fileDataUrl)
    if (activeTemplates.length === 0) {
      return `
        <!doctype html>
        <html>
          <title>A2J document preview</title>
          <body><p>No documents could be previewed because there are no active text templates.</p></body>
        </html>
      `
    }

    const templatesWithoutConditions = activeTemplates.filter(filterTemplatesByCondition(answers))
    if (templatesWithoutConditions.length === 0) {
      return `
        <!doctype html>
        <html>
          <title>A2J document preview</title>
          <body><p>No documents could be previewed because the only active templates have conditional logic.</p></body>
        </html>
      `
    }

    return renderHtmlForTemplates(templatesWithoutConditions, req, fileDataUrl, answers).catch(error => {
      debug('Assemble error:', error)
      throw error
    })
  })()

  /* Set download headers */
  res.set({
    status: 201,
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': `attachment; filename=${downloadName}`
  })

  return new Promise((resolve, reject) => {
    try {
      res.send(previewHtml)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = router
