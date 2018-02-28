'use strict';

var filenamify = require('filenamify');
var _kebabCase = require('lodash/kebabCase');

module.exports = function () {
  var guideTitle = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  // remove reserved chars
  var filename = filenamify(guideTitle, { replacement: '' });
  return _kebabCase(filename || 'document') + '.pdf';
};