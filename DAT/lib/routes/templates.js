'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var Q = require('q');
var _ = require('lodash');
var paths = require('../util/paths');
var files = require('../util/files');
var user = require('../util/user');
var debug = require('debug')('A2J:routes/templates');

var filterTemplatesByActive = function filterTemplatesByActive(active, templates) {
  return active != null ? _.filter(templates, { active: active }) : templates;
};

/**
 * @module {Module} /routes/templates templates
 * @parent api
 *
 * Module containing methods for handling /templates route
 * and helper functions.
 *
 * ## Use
 * @codestart
 * var templates = require('routes/templates');
 * var app = feathers();
 * app.use('/api/templates', templates);
 * @codeend
 *
 */
module.exports = {
  /**
   * @property {Function} templates.getTemplatesPath
   * @parent templates
   *
   * Read the templates.json file. If it does not exist,
   * create it with an empty array.
   *
   * @return {Promise} a Promise that will resolve to the
   * path to templates data.
   */
  getTemplatesJSON: function getTemplatesJSON(_ref) {
    var username = _ref.username;

    var templatesJSONPath = void 0;

    var pathPromise = paths.getTemplatesPath({ username: username }).then(function (templatesPath) {
      templatesJSONPath = templatesPath;
      return templatesPath;
    });

    return pathPromise.then(function (path) {
      return files.readJSON({ path: path });
    }).catch(function (err) {
      debug(err);
      debug('Writing ' + templatesJSONPath);
      return files.writeJSON({ path: templatesJSONPath, data: [] });
    });
  },


  /**
   * @property {Function} templates.find
   * @parent templates
   *
   * Find all templates in `fileDataUrl`
   *
   * Reads the templates.json file in `fileDataUrl`, then uses the templateId
   * from this list to open each individual template file, filters them based
   * on the `active` param (if available) and then send back the combined data.
   *
   * ## Use
   *
   * GET /api/templates?fileDataUrl="path/to/data/folder"&active=true
   * GET /api/templates?fileDataUrl="path/to/data/folder"&active=false
   */
  find: function find(params, callback) {
    var _ref2 = params.query || {},
        active = _ref2.active,
        fileDataUrl = _ref2.fileDataUrl;

    if (!fileDataUrl) {
      return callback('You must provide fileDataUrl');
    }

    var templateIndexPromise = paths.getTemplatesPath({ fileDataUrl: fileDataUrl }).then(function (path) {
      return files.readJSON({ path: path });
    });

    var templatePromises = templateIndexPromise.then(function (templateIndex) {
      return _.map(templateIndex, function (_ref3) {
        var templateId = _ref3.templateId;

        return paths.getTemplatePath({ templateId: templateId, fileDataUrl: fileDataUrl }).then(function (path) {
          return files.readJSON({ path: path });
        });
      });
    });

    Q.all(templatePromises).then(function (templates) {
      return filterTemplatesByActive(active, templates);
    }).then(function (filteredTemplates) {
      return callback(null, filteredTemplates);
    }).catch(function (error) {
      debug(error);
      callback(error);
    });
  },


  /**
   * @property {Function} templates.get
   * @parent templates
   *
   * Get all templates associated with a guideId.
   *
   * Filters the templates.json file to a list of templates that match the guideId.
   * Then uses the guideId and templateId from this list to open each individual
   * template file and combine the data.
   *
   * ## Use
   *
   * GET /api/templates/{guide_id}
   * GET /api/templates/{guide_id}?active=true
   * GET /api/templates/{guide_id}?active=false
   */
  get: function get(guideId, params, callback) {
    var _this = this;

    debug('GET /api/templates/' + guideId);

    var cookieHeader = params.cookieHeader;

    var _ref4 = params.query || {},
        active = _ref4.active;

    var usernamePromise = user.getCurrentUser({ cookieHeader: cookieHeader });

    var filterByGuideId = function filterByGuideId(coll) {
      return _.filter(coll, function (o) {
        return o.guideId === guideId;
      });
    };

    var filteredTemplateSummaries = usernamePromise.then(function (username) {
      return _this.getTemplatesJSON({ username: username });
    }).then(filterByGuideId);

    var templatePromises = Q.all([filteredTemplateSummaries, usernamePromise]).then(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
          filteredTemplates = _ref6[0],
          username = _ref6[1];

      return _.map(filteredTemplates, function (_ref7) {
        var guideId = _ref7.guideId,
            templateId = _ref7.templateId;

        var pathPromise = paths.getTemplatePath({
          guideId: guideId, templateId: templateId, username: username
        });

        return pathPromise.then(function (path) {
          return files.readJSON({ path: path });
        });
      });
    });

    var debugTemplatesByGuide = function debugTemplatesByGuide(templates) {
      if (templates.length) {
        debug('Found', templates.length, 'templates for guide', guideId);
      } else {
        debug('No templates found for guideId ' + guideId);
      }
    };

    Q.all(templatePromises).then(function (templates) {
      return filterTemplatesByActive(active, templates);
    }).then(function (filteredTemplates) {
      debugTemplatesByGuide(filteredTemplates);
      callback(null, filteredTemplates);
    }).catch(function (error) {
      debug(error);
      callback(error);
    });
  }
};