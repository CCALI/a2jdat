'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _ = require('lodash');
var Q = require('q');
var paths = require('../util/paths');
var files = require('../util/files');
var user = require('../util/user');
var templates = require('./templates');

var debug = require('debug')('A2J:routes/template');

/**
 * @module {Module} /routes/template template
 * @parent api
 *
 * Module containing methods for handling /template route
 * and helper functions.
 *
 * ## Use
 * @codestart
 * var template = require('routes/template');
 * var app = feathers();
 * app.use('/api/template', template);
 * @codeend
 *
 */
module.exports = {
  /**
   * @property {Function} templates.summaryFields
   * @parent templates
   *
   * Fields from template to be included in summary templates.json file.
   *
   */
  summaryFields: ['guideId', 'templateId'],
  /**
   * @property {Function} templates.filterTemplatesByTemplateId
   * @parent templates
   *
   * Filter an array of templates to find the one with matching
   * templateId.
   *
   * @param {Array} templatesData
   * @param {Number} templateId
   * @return {Object} template from templates array matching templateId
   */
  filterTemplatesByTemplateId: function filterTemplatesByTemplateId(_ref) {
    var templatesData = _ref.templatesData,
        templateId = _ref.templateId;

    var template = _.find(templatesData, function (o) {
      return o.templateId === parseInt(templateId, 10);
    });

    if (!template) {
      throw new Error('Template not found with templateId ' + templateId);
    }

    return template;
  },


  /**
   * @property {Function} templates.getNextTemplateId
   * @parent templates
   *
   * Get the next valid template id by adding 1 to the
   * highest existing templateId.
   *
   * @param {Array} templates - list of existing templates.
   * @return {Number} next valid templateId.
   */
  getNextTemplateId: function getNextTemplateId(_ref2) {
    var templatesData = _ref2.templatesData;

    var maxId = _.max(_.map(templatesData, function (template) {
      return template.templateId;
    })) || 0;
    return maxId + 1;
  },


  /**
   * @property {Function} templates.successHandler
   * @parent templates
   *
   * Common handler for API successes.
   *
   * @param {String} msg - debug message.
   * @param {Object} data - response data.
   * @param {Function} callback - API callback.
   */
  successHandler: function successHandler(_ref3) {
    var msg = _ref3.msg,
        data = _ref3.data,
        callback = _ref3.callback;

    debug(msg);
    callback(null, data);
  },


  /**
   * @property {Function} templates.successHandler
   * @parent templates
   *
   * Common handler for API failures.
   *
   * @param {String} error - error message.
   * @param {Function} callback - API callback.
   */
  errorHandler: function errorHandler(_ref4) {
    var error = _ref4.error,
        callback = _ref4.callback;

    debug(error);
    callback(error);
  },


  /**
   * @property {Function} template.get
   * @parent templates
   *
   * Get a templates by id.
   *
   * ## Use
   *
   * GET /api/template/{template_id}
   */
  get: function get(templateId, params, callback) {
    var _this = this;

    debug('GET /api/template/' + templateId + ' request');

    var usernamePromise = user.getCurrentUser({ cookieHeader: params.cookieHeader });

    var templateSummaryPromise = usernamePromise.then(function (username) {
      return templates.getTemplatesJSON({ username: username });
    }).then(function (templatesData) {
      return _this.filterTemplatesByTemplateId({ templatesData: templatesData, templateId: templateId });
    });

    Q.all([templateSummaryPromise, usernamePromise]).then(function (_ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
          _ref6$ = _ref6[0],
          guideId = _ref6$.guideId,
          templateId = _ref6$.templateId,
          username = _ref6[1];

      return paths.getTemplatePath({
        guideId: guideId,
        templateId: templateId,
        username: username
      });
    }).then(function (templatePath) {
      return files.readJSON({ path: templatePath });
    }).then(function (data) {
      return _this.successHandler({
        msg: 'GET /api/template/' + templateId + ' response: ' + JSON.stringify(data),
        data: data,
        callback: callback
      });
    }).catch(function (error) {
      return _this.errorHandler({ error: error, callback: callback });
    });
  },


  /**
   * @property {Function} template.create
   * @parent templates
   *
   * Create a new template.
   *
   * Write a template file and update the templates.json
   * file with the new template data.
   *
   * ## Use
   *
   * POST /api/template
   */
  create: function create(data, params, callback) {
    var _this2 = this;

    debug('POST /api/template request: ' + JSON.stringify(data));

    var currentTime = Date.now();
    var usernamePromise = user.getCurrentUser({ cookieHeader: params.cookieHeader });

    var templateDataPromise = usernamePromise.then(function (username) {
      return templates.getTemplatesJSON({ username: username });
    }).then(function (templatesData) {
      return _this2.getNextTemplateId({ templatesData: templatesData });
    }).then(function (templateId) {
      return _.assign(data, {
        templateId: templateId,
        createdAt: currentTime,
        updatedAt: currentTime
      });
    });

    var writeTemplatePromise = Q.all([templateDataPromise, usernamePromise]).then(function (_ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
          _ref8$ = _ref8[0],
          guideId = _ref8$.guideId,
          templateId = _ref8$.templateId,
          username = _ref8[1];

      return paths.getTemplatePath({
        guideId: guideId,
        templateId: templateId,
        username: username
      });
    }).then(function (path) {
      return files.writeJSON({ path: path, data: data });
    });

    var templatesPathPromise = usernamePromise.then(function (username) {
      return paths.getTemplatesPath({ username: username });
    });

    var writeSummaryPromise = Q.all([templatesPathPromise, templateDataPromise]).then(function (_ref9) {
      var _ref10 = _slicedToArray(_ref9, 2),
          path = _ref10[0],
          templateData = _ref10[1];

      return files.mergeJSON({
        path: path,
        data: _.pick(templateData, _this2.summaryFields)
      });
    });

    Q.all([writeTemplatePromise, writeSummaryPromise]).then(function (_ref11) {
      var _ref12 = _slicedToArray(_ref11, 1),
          data = _ref12[0];

      return _this2.successHandler({
        msg: 'POST /api/template response: ' + JSON.stringify(data),
        data: data,
        callback: callback
      });
    }).catch(function (error) {
      return _this2.errorHandler({ error: error, callback: callback });
    });
  },


  /**
   * @property {Function} template.update
   * @parent templates
   *
   * Update a template file and update the templates.json
   * file with the new template data.
   *
   * ## Use
   *
   * PUT /api/template/{template_id}
   */
  update: function update(templateId, data, params, callback) {
    var _this3 = this;

    debug('PUT /api/template/' + templateId + ' request: ' + JSON.stringify(data));

    var currentTime = Date.now();
    _.assign(data, {
      templateId: +templateId,
      updatedAt: currentTime
    });

    var usernamePromise = user.getCurrentUser({ cookieHeader: params.cookieHeader });

    var writeTemplatePromise = usernamePromise.then(function (username) {
      return paths.getTemplatePath({
        guideId: data.guideId,
        templateId: data.templateId,
        username: username
      });
    }).then(function (path) {
      return files.writeJSON({ path: path, data: data });
    });

    var writeSummaryPromise = usernamePromise.then(function (username) {
      return paths.getTemplatesPath({ username: username });
    }).then(function (path) {
      return files.mergeJSON({
        path: path,
        data: _.pick(data, _this3.summaryFields),
        replaceKey: 'templateId'
      });
    });

    Q.all([writeTemplatePromise, writeSummaryPromise]).then(function (_ref13) {
      var _ref14 = _slicedToArray(_ref13, 1),
          data = _ref14[0];

      return _this3.successHandler({
        msg: 'PUT /api/template/' + templateId + ' response: ' + JSON.stringify(data),
        data: data,
        callback: callback
      });
    }).catch(function (error) {
      return _this3.errorHandler({ error: error, callback: callback });
    });
  }
};