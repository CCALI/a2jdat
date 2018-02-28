'use strict';

var Q = require('q');
var path = require('path');
var config = require('./config');
var urlRegex = require('url-regex');

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
   */
  getViewerPath: function getViewerPath() {
    return path.join(__dirname, '..', '..', '../a2j-viewer/viewer');
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
  normalizeFileDataUrl: function normalizeFileDataUrl(fileDataUrl) {
    var isAbsolutePath = path.isAbsolute(fileDataUrl);
    var isUrl = urlRegex({ exact: true }).test(fileDataUrl);

    return isUrl || isAbsolutePath ? fileDataUrl : path.join(this.getViewerPath(), fileDataUrl);
  },


  /**
   * @property {Function} paths.getTemplatesPath
   * @parent paths
   *
   * @return {Promise} a Promise that will resolve to the
   * path to the templates.json file for the current user.
   */
  getTemplatesPath: function getTemplatesPath(_ref) {
    var username = _ref.username,
        fileDataUrl = _ref.fileDataUrl;

    var deferred = Q.defer();
    var guidesDir = config.get('GUIDES_DIR');

    var file = fileDataUrl ? path.join(this.normalizeFileDataUrl(fileDataUrl), 'templates.json') : path.join(guidesDir, username, 'templates.json');

    deferred.resolve(file);

    return deferred.promise;
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
  getTemplatePath: function getTemplatePath(_ref2) {
    var username = _ref2.username,
        guideId = _ref2.guideId,
        templateId = _ref2.templateId,
        fileDataUrl = _ref2.fileDataUrl;

    var deferred = Q.defer();
    var guidesDir = config.get('GUIDES_DIR');
    var folderName = 'guides/Guide' + guideId;
    var filename = 'template' + templateId + '.json';

    var file = fileDataUrl ? path.join(this.normalizeFileDataUrl(fileDataUrl), filename) : path.join(guidesDir, username, folderName, filename);

    deferred.resolve(file);

    return deferred.promise;
  }
};