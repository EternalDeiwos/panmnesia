'use strict'

/**
 * Dependencies
 * @ignore
 */
const util = require('util')
const chai = require('chai')
const expect = chai.expect

/**
 * Assertions
 * @ignore
 */
chai.should()

/**
 * Test Code
 * @ignore
 */
const { Registry } = require('../src')

/**
 * Constants
 */

/**
 * Registry
 */
describe('Registry', () => {
  describe('constructor', () => {
    const source = {}
    const state = {}

    it('should return a registry', () => {
      const registry = new Registry({ source })
      registry.should.be.an.instanceOf(Registry)
    })

    it('should define an events database', () => {
      const registry = new Registry({ source })
      registry.source.should.equal(source)
    })

    it('should not define a state cache database if none is supplied', () => {
      const registry = new Registry({ source })
      expect(registry.state).to.be.undefined
    })

    it('should define a state cache database if one is supplied', () => {
      const registry = new Registry({ source, state })
      registry.state.should.equal(state)
    })

    it('should set the cache flag', () => {
      const registry = new Registry({ source, state })
      registry.cache.should.be.true
    })

    it('should override the cache flag', () => {
      const registry = new Registry({ source, state, cache: false })
      registry.cache.should.be.false
    })

    it('should define an empty registry', () => {
      const registry = new Registry({ source })
      registry.registry.should.deep.equal({})
    })
  })

  describe('inspect', () => {
    it('should log a custom string', () => {
      const registry = new Registry({ source: {} })
      const output = util.inspect(registry)
      output.startsWith('Registry {').should.be.true
      output.startsWith('Registry { registry: {').should.be.false
    })
  })
})
