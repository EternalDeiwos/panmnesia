'use strict'

/**
 * Dependencies
 * @ignore
 */
const chai = require('chai')

/**
 * Assertions
 * @ignore
 */
chai.should()

/**
 * Test Code
 * @ignore
 */
const id = require('../src/Identifier')

/**
 * Constants
 */
const generated = '11e7b68fb373d1a0a33e8fb9afebf642'

/**
 * Identifier
 */
describe('Identifier', () => {
  it('should generate a unique identifier', () => {
    id().should.not.equal(generated)
  })

  it('should start with `1`', () => {
    id().startsWith('1').should.be.true
  })

  it('should be 32 hex characters long', () => {
    id().length.should.equal(32)
  })
})
