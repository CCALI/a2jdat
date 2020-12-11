const assert = require('assert')

const {
  getHeaderFooterNode,
  parseHeaderFooterHTML
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
})
