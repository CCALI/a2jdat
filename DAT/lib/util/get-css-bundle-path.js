'use strict';

var path = require('path');

module.exports = function () {
  var rootPath = path.join(__dirname, '..', '..');

  return path.join(rootPath, 'dist', 'bundles', 'caja', 'server.css');
};