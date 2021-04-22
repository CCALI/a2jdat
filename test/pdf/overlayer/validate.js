const test = require('ava')

const { validate } = require('../../../src/pdf/overlayer/validate')

const { overlayObject } = require('../helpers/validate')

test('validate works for strings', t => {
  let result = validate(overlayObject)
  t.is(result, null)
})

test('validate works for empty strings', t => {
  overlayObject.patches[0].overflow.addendumLabel = ''
  let result = validate(overlayObject)
  t.is(result, null)
})

test('validate should fail for number', t => {
  overlayObject.patches[0].overflow.addendumLabel = 2
  let results = !validate(overlayObject)
  t.is(results, false)
})

test('validate should fail for null', t => {
  overlayObject.patches[0].overflow.addendumLabel = null
  let results = !validate(overlayObject)
  t.is(results, false)
})

test('validate should fail for undefined', t => {
  overlayObject.patches[0].overflow.addendumLabel = undefined
  let results = !validate(overlayObject)
  t.is(results, false)
})
