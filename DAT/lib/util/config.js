'use strict';

var config = void 0;

module.exports = {
  get: function get(key) {
    if (typeof config === 'undefined') {
      try {
        config = require('../../../config.json');
      } catch (e) {
        throw new Error('Unable to load config.json');
      }
    }

    return config[key];
  }
};