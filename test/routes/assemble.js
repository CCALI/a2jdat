const app = require('../../src/app')
const path = require('path')
const request = require('supertest')

describe('POST /api/assemble', function () {
  it('fails if answers is missing', function (done) {
    request(app)
      .post('/api/assemble')
      .send({ answers: null, guideId: '1262' })
      .expect(400, 'Answers must be a valid stringified JSON object')
      .end(function (err) {
        if (err) return done(err)
        done()
      })
  })
  it('fails if guideId and fileDataUrl are missing', function (done) {
    request(app)
      .post('/api/assemble')
      .send({ answers: '{}', fileDataUrl: null, guideId: null })
      .expect(400, 'You must provide either guideId or fileDataUrl')
      .end(function (err) {
        if (err) return done(err)
        done()
      })
  })

  // this issue is skipped due to https://github.com/CCALI/a2jdat/issues/135
  it.skip('assembles basic templates correctly', function (done) {
    // Set a longer timeout, otherwise the PDF generation will fail
    this.timeout(5000000)

    // __dirname,

    const fileDataUrl = path.join('../', 'data', 'DEV', 'guides', 'Guide1262')

    request(app)
    .post('/api/assemble')
    .send({
      answers: '{}',
      fileDataUrl
    })
    .expect(200)
    .end(function (err) {
      if (err) {
        console.log(err)
        return done(err)
      }
      done()
    })
  })
})
