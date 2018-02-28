'use strict';

var Q = require('q');
var request = require('request');
var config = require('./config');
var url = require('url');

var debug = require('debug')('A2J:util/user');

/**
 * @module {Module} /util/user user
 * @parent api
 *
 * Module containing utilities for retrieving
 * information about the user.
 *
 */
module.exports = {
  /**
   * @property {Function} user.handleError
   * @parent user
   *
   * Error Handler.
   */
  handleError: function handleError(_ref) {
    var msg = _ref.msg,
        serverURL = _ref.serverURL,
        deferred = _ref.deferred,
        cookieHeader = _ref.cookieHeader;

    var hostname = url.parse(serverURL).hostname;

    if (hostname === 'localhost') {
      debug('getCurrentUser hardcoding to dev');
      deferred.resolve('dev');
    }

    deferred.reject('Cannot authenticate current user');
  },


  /**
   * @property {Function} user.getCurrentUser
   * @parent user
   *
   * Get the current user based on the PHP session.
   */
  getCurrentUser: function getCurrentUser(_ref2) {
    var _this = this;

    var cookieHeader = _ref2.cookieHeader;

    var deferred = Q.defer();
    var serverURL = config.get('SERVER_URL');

    debug('getCurrentUser request', cookieHeader);

    request.post(serverURL + '/js/author/CAJA_WS.php', {
      headers: {
        Cookie: cookieHeader
      },
      form: { cmd: 'currentuser' }
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        try {
          body = JSON.parse(body);
          debug('currentuser response ' + body.username);
          deferred.resolve(body.username);
        } catch (err) {
          _this.handleError({
            msg: 'getCurrentUser error ' + err,
            serverURL: serverURL,
            deferred: deferred,
            cookieHeader: cookieHeader
          });
        }
      } else {
        var statusCode = response && response.statusCode;
        _this.handleError({
          msg: 'getCurrentUser error (' + statusCode + '): ' + error + ' ',
          serverURL: serverURL,
          deferred: deferred,
          cookieHeader: cookieHeader
        });
      }
    });

    return deferred.promise;
  }
};