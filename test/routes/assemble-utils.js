const assert = require('assert')
const sinon = require('sinon')
const Q = require('q')
const files = require('../../src/util/files')

const {
  getHeaderFooterNode,
  parseHeaderFooterHTML,
  createInlineStyles,
  filterTemplatesByCondition
} = require('../../src/routes/assemble-utils')

describe('assemble-utils test', function () {
  it('getHeaderFooterNode', () => {
    const headerHtml = `<p>line 1 client <strong>last</strong> name:&nbsp;<a2j-variable name="Client last name TE"></a2j-variable><br />
    line 2 client <u>middle</u> name:&nbsp;<a2j-variable name="Client middle name TE"></a2j-variable></p>`

    const headerNodeRoot = getHeaderFooterNode(headerHtml)
    const headerNodeVars = headerNodeRoot.querySelectorAll('a2j-variable')

    assert.equal(headerNodeVars.length, 2, 'should allow query of basic DOM tree')
  })

  it('parseHeaderFooterHTML', () => {
    const headerHtml = `<p>line 1 client <strong>last</strong> name:&nbsp;<a2j-variable name="Client last name TE"></a2j-variable><br />
    line 2 client <u>middle</u> name:&nbsp;<a2j-variable name="Client first name TE"></a2j-variable>
    line 3 client <u>middle</u> name:&nbsp;<a2j-variable name="Client middle name TE"></a2j-variable></p>`

    const firstNameAnswer = { name: 'client first name te', values: [null, 'Ponce'] }
    const lastNameAnswer = { name: 'client last name te', values: [null, 'De Leon'] }
    const answers = { 'client first name te': firstNameAnswer, 'client last name te': lastNameAnswer }

    const headerNodeRoot = getHeaderFooterNode(headerHtml)

    const parsedHtml = parseHeaderFooterHTML(headerNodeRoot, answers)
    const containsFirstName = parsedHtml.indexOf('Ponce') !== -1
    const containsLastName = parsedHtml.indexOf('De Leon') !== -1

    assert.ok(containsFirstName, 'should add first name to parsed html')
    assert.ok(containsLastName, 'should add last name to parsed html')
  })

  it('createInlineStyles', async () => {
    const readFilePromise = Q.defer()
    const readFileStub = sinon.stub(files, 'readFile')
    readFileStub.returns(readFilePromise.promise)
    readFilePromise.resolve('body{background:#ababab;}')

    const inlineStyles = await createInlineStyles('../data/testCSS.css')
    const expectedResult = `<style>\nbody{background:#ababab;}\n</style>`

    assert.equal(inlineStyles, expectedResult, 'should read minified css file and insert into style tag')
    readFileStub.restore()
  })

  it('filterTemplatesByCondition', () => {
    const allTemplates = [
      { rootNode: {} }, // legacy text template with no state object
      { rootNode: { state: {} } }, // template with no conditional state
      { rootNode: { state: { // template with render condition state
        'sectionCounter': 'none',
        'fontFamily': 'sans-serif',
        'fontSize': '14',
        'operator': 'is-equal',
        'leftOperand': 'Client first name TE',
        'rightOperand': 'Jessica',
        'rightOperandType': 'text',
        'hasConditionalLogic': true
      } } }
    ]
    const answers = {
      'client first name te': {
        name: 'Client first name TE',
        values: [null, 'JessBob']
      }
    }
    let isTemplateLogical = filterTemplatesByCondition(answers)
    let templates = allTemplates.filter(isTemplateLogical)

    assert.equal(templates.length, 2, 'should render 2 of 3 templates when name conditional fails')

    answers['client first name te'].values = [null, 'Jessica']
    isTemplateLogical = filterTemplatesByCondition(answers)
    templates = allTemplates.filter(isTemplateLogical)

    assert.equal(templates.length, 3, 'should render 3 of 3 templates when name matches')
  })
})
