'use strict';

var he = require('he');
var url = require('url');
var path = require('path');
var ssr = require('done-ssr');
var through = require('through2');
var feathers = require('feathers');
var wkhtmltopdf = require('wkhtmltopdf');
var filenamify = require('../util/pdf-filename');
var forwardCookies = require('../util/cookies').forwardCookies;
var getCssBundlePath = require('../util/get-css-bundle-path');
var conf = require('../util/config');


var debug = require('debug')('A2J:assemble');
var router = feathers.Router();

var render = ssr({
  main: 'caja/server.stache!done-autorender',
  config: path.join(__dirname, '..', '..', 'package.json!npm')
});

// it won't work on the server without this
wkhtmltopdf.command = conf.get('WKHTMLTOPDF_PATH');//'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf'; //'/usr/local/bin/wkhtmltopdf';

// middleware to validate the presence of either `guideId` or
// `fileDataUrl`, during document assembly one of those two
// properties is needed to retrieve the template's data.
var checkPresenceOf = function checkPresenceOf(req, res, next) {
  var _req$body = req.body,
      guideId = _req$body.guideId,
      fileDataUrl = _req$body.fileDataUrl;


  if (!guideId && !fileDataUrl) {
    return res.status(400).send('You must provide either guideId or fileDataUrl');
  }

  next();
};

router.post('/', checkPresenceOf, forwardCookies, function (req, res) {
  var url = req.protocol + '://' + req.get('host') + req.originalUrl;
  var headerFooterUrl = url + '/header-footer?content=';

  debug('Request payload: ', req.body);

  var pdfOptions = {
    'header-spacing': 5,
    'footer-spacing': 5
  };

  var toPdf = function toPdf(filename, html) {
    if (!html) {
      res.status(500).send('There was a problem generating the document, try again later.');
    }

    var _req$body2 = req.body,
        header = _req$body2.header,
        hideHeaderOnFirstPage = _req$body2.hideHeaderOnFirstPage;
    var _req$body3 = req.body,
        footer = _req$body3.footer,
        hideFooterOnFirstPage = _req$body3.hideFooterOnFirstPage;


    res.set({
      status: 201,
      'Content-Type': 'application/pdf',
      'Access-Control-Allow-Origin': '*',
      'Content-Disposition': 'attachment; filename=' + filename
    });

    if (header) {
      var h = encodeURIComponent(header);
      var hofp = encodeURIComponent(hideHeaderOnFirstPage);

      pdfOptions['header-html'] = '' + headerFooterUrl + h + '&hideOnFirstPage=' + hofp;
    }

    if (footer) {
      var f = encodeURIComponent(footer);
      var _hofp = encodeURIComponent(hideFooterOnFirstPage);

      pdfOptions['footer-html'] = '' + headerFooterUrl + f + '&hideOnFirstPage=' + _hofp;
    }

    // finally call wkhtmltopdf with the html generated from the can-ssr call
    // and pipe it into the response object.
    wkhtmltopdf(html, pdfOptions).pipe(res);
  };

  var onFailure = function onFailure(error) {
    res.status(500).send(error);
  };

  // make the absolute path to the css bundle available in the request
  // object so the template can use it to load it using a file uri,
  // otherwise wkhtmltopdf won't load the styles at all.
  req.__cssBundlePath = getCssBundlePath();

  var renderStream = render(req);
  renderStream.pipe(through(function (buffer) {
    var html = buffer.toString();
    var title = req.body.guideTitle;

    toPdf(filenamify(title), he.decode(html));
  }));

  renderStream.on('error', onFailure);
});

router.get('/header-footer', forwardCookies, function (req, res) {
  var query = url.parse(req.originalUrl, true).query;

  if (query.page === '1' && query.hideOnFirstPage === 'true') {
    res.status(200).send('<!DOCTYPE html>');
  } else {
    res.status(200).send('<!DOCTYPE html>' + query.content);
  }
});

module.exports = router;