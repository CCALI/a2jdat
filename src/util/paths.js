const Q = require('q')
const path = require('path')
const config = require('./config')
const urlRegex = require('url-regex')
const debug = require('debug')('A2J:util/paths')
const files = require('./files')

/**
 * @module {Module} /util/paths paths
 * @parent api
 *
 * Module containing utility functions for working
 * with file paths.
 *
 */
module.exports = {
  /**
   * @function paths.getViewerPath
   * @parent paths
   * @return {String} Absolute path to the viewer app folder
   *
   *  if the config value exists, most likely a standalone viewer/dat install
   *  if not use the default A2J Author location
   */
  getViewerPath () {
    const viewerConfigPath =
      config.get('VIEWER_PATH') ||
      path.join(__dirname, '..', '..', '..', 'a2jviewer')
    debug('config.VIEWER_PATH', viewerConfigPath)
    return viewerConfigPath
  },

  /**
   * @function paths.normalizeFileDataUrl
   * @parent paths
   * @param {String} fileDataUrl URL where the file data folder is located
   *
   * When `fileDataUrl` is used to locate the template(s) json files,
   * we need to build the templates path using the viewer folder as
   * the base if `fileDataUrl` is relative, otherwise we just use the
   * absolute `fileDataUrl` as-is.
   *
   * @return {String} Normalized file data url
   */
  normalizeFileDataUrl (fileDataUrl) {
    const isAbsolutePath = path.isAbsolute(fileDataUrl)
    const isUrl = urlRegex({ exact: true }).test(fileDataUrl)

    return isUrl || isAbsolutePath
      ? fileDataUrl
      : path.join(this.getViewerPath(), fileDataUrl)
  },

  /**
   * @function paths.getGuideDirPath
   * @parent paths
   * @param {String} username - current username.
   * @param {String} guideId - id of the guide.
   * @param {String} fileDataUrl - used for standalone assembly
   *
   * When `fileDataUrl` is used to locate the root Guide directory,
   * we need to build the Guide path using the viewer folder as
   * the base if `fileDataUrl` is relative, otherwise we just use the
   * absolute `fileDataUrl` as-is.
   *
   * @return {String} Normalized file data url
   */
  getGuideDirPath (username, guideId, fileDataUrl) {
    const guidesDir = config.get('GUIDES_DIR')

    return fileDataUrl
      ? path.join(this.normalizeFileDataUrl(fileDataUrl))
      : path.join(guidesDir, username, 'guides', `Guide${guideId}`)
  },

  /**
   * @property {Function} paths.getTemplatesPath
   * @parent paths
   * @param {String} username - current username.
   * @param {String} guideId - id of the guide.
   * @param {String} fileDataUrl - used for standalone assembly
   *
   * @return {Promise}
   */
  async getTemplatesPath ({ username, guideId, fileDataUrl }) {
    const deferred = Q.defer()
    const guidesDir = config.get('GUIDES_DIR')

    // get the root path, minus the templates.json
    const rootPath = fileDataUrl
      ? path.join(this.normalizeFileDataUrl(fileDataUrl))
      : path.join(guidesDir, username, 'guides', `Guide${guideId}`)
    const templatesPath = path.join(rootPath, 'templates.json')

    // catch missing templates.json -- should rarely happen
    const exists = await files.pathExists(templatesPath)
    if (!exists) {
      try {
        const guideFiles = await files.readDir({ path: rootPath })
        const templateIds = await this.getTemplateIds(guideFiles)
        await this.createTemplatesJSON(
          templatesPath,
          guideId,
          templateIds
        )
      } catch (err) {
        console.error(err)
      }
    }

    deferred.resolve(templatesPath)
    return deferred.promise
  },

  // return an array of templateIds
  getTemplateIds (guideFiles) {
    return new Promise((resolve, reject) => {
      const templateFiles = guideFiles.filter(
        filename =>
          filename.startsWith('template') &&
          filename.endsWith('.json') &&
          filename !== 'templates.json'
      )

      let templateIds = templateFiles.map(fileName => {
        const startIndex = fileName.indexOf('template') + 8
        const endIndex = fileName.indexOf('.', startIndex)

        return parseInt(fileName.substring(startIndex, endIndex))
      })

      templateIds = templateIds.filter((c, index) => {
        return templateIds.indexOf(c) === index
      })
      resolve(templateIds)
    })
  },

  /**
   * @property {Function} paths.createTemplatesJSON
   * @parent paths
   *
   * @param {String} guideId - id of the guide.
   * @param {String} templatePath - path to the templates.json file
   * @param {Array} directoryFiles - Array of file names in the directory
   * @return {Promise} a Promise that will resolve to the
   * content that was written to the file
   */
  createTemplatesJSON (templatesPath, guideId, templateIds) {
    return files.writeJSON({
      path: templatesPath,
      data: { guideId, templateIds }
    })
  },

  /**
   * @property {Function} paths.getTemplatePath
   * @parent paths
   *
   * @param {String} guideId - id of the guide.
   * @param {String} templateId - id of the template.
   * @return {Promise} a Promise that will resolve to the
   * path to the JSON file of a template.
   */
  getTemplatePath ({ username, guideId, templateId, fileDataUrl }) {
    const deferred = Q.defer()
    const guidesDir = config.get('GUIDES_DIR')
    const folderName = `guides/Guide${guideId}`
    const filename = `template${templateId}.json`

    const file = fileDataUrl
      ? path.join(this.normalizeFileDataUrl(fileDataUrl), filename)
      : path.join(guidesDir, username, folderName, filename)

    deferred.resolve(file)

    return deferred.promise
  }
}
