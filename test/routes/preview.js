const assert = require('assert')
const { parse } = require('node-html-parser')
const path = require('path')
const request = require('supertest')
const app = require('../../src/app')
const template2115 = require('../data/DEV/guides/Guide1263/template2115.json')

describe('POST /api/preview', function () {
  it('fails if answers is missing', function (done) {
    request(app)
      .post('/api/preview')
      .send({ answers: null, guideId: '1262' })
      .expect(400, 'Answers must be a valid stringified JSON object')
      .end(function (error) {
        if (error) return done(error)
        done()
      })
  })
  it('fails if guideId and fileDataUrl are missing', function (done) {
    request(app)
      .post('/api/preview')
      .send({ answers: '{}', fileDataUrl: null, guideId: null })
      .expect(400, 'You must provide either guideId or fileDataUrl')
      .end(function (error) {
        if (error) return done(error)
        done()
      })
  })
  // TODO: this test is skipped due to the issue described in https://github.com/CCALI/a2jdat/issues/100
  it.skip('previews basic templates correctly', function (done) {
    // Set a longer timeout, otherwise the HTML generation will fail
    this.timeout(10000)

    const fileDataUrl = path.join(__dirname, '..', 'data', 'DEV', 'guides', 'Guide1263')
    request(app)
      .post('/api/preview')
      .set('Accept', 'text/html')
      .send({
        answers: '{}',
        fileDataUrl
      })
      .expect('Content-Type', /html/)
      .expect(200)
      .then(response => {
        const parsedHtml = parse(response.res.text)

        const htmlTitles = parsedHtml.querySelectorAll('title')
        assert.equal(htmlTitles.length, 1, 'the document has one title')
        assert.equal(htmlTitles.toString(), '<title>A2J Test Assemble</title>', 'the title is correct')

        const htmlFooters = parsedHtml.querySelectorAll('footer')
        assert.equal(htmlFooters.length, 1, 'the document has one footer')
        assert.equal(htmlFooters.toString(), `<footer>${template2115.footer}</footer>`, 'the footer is correct')

        const htmlHeaders = parsedHtml.querySelectorAll('header')
        assert.equal(htmlHeaders.length, 1, 'the document has one header')
        assert.equal(htmlHeaders.toString(), `<header>${template2115.header}</header>`, 'the header is correct')

        done()
      })
      .catch(error => done(error))
  })
})
