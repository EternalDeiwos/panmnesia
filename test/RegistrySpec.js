'use strict'

/**
 * Dependencies
 * @ignore
 */
const util = require('util')
const chai = require('chai')
const PouchDB = require('pouchdb')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect

/**
 * Assertions
 * @ignore
 */
chai.should()
chai.use(sinonChai)
chai.use(chaiAsPromised)

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
  before('Reset database', () => {
    const db = new PouchDB('testdb/test1')
    if (db) {
      return db.destroy() // reset the database
    }
  })

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

  describe('store', () => {
    let store, registry, changeFeedStub

    beforeEach(() => {
      registry = new Registry({})
      changeFeedStub = sinon.stub(registry, 'createChangeFeed')
    })

    afterEach(() => {
      changeFeedStub.restore()
    })

    it('should create an empty store', () => {
      store = registry.createStore()
      registry.store.should.not.be.undefined
      changeFeedStub.should.be.called
    })

    it('should return the redux store', () => {
      store = registry.createStore()
      registry.getStore().should.equal(store)
    })

    it('should return null if there is no store', () => {
      expect(registry.getStore()).to.be.null
    })

    it('should never create store if a store already exists', () => {
      registry.store = true
      registry.createStore().should.be.true // should just return the store as is
    })
  })

  describe('createStore', () => {
    it('should create change feed on promise rejection', (done) => {
      const cacheGetStub = sinon.stub().rejects({})
      const cache = { get: cacheGetStub }
      let registry = new Registry({state: cache})
      const changeFeedStub = sinon.stub(registry, 'createChangeFeed')

      registry.createStore()

      cacheGetStub.should.be.calledOnce

      //TODO: Find a better way to test this.
      setTimeout(() => {
        changeFeedStub.should.be.called
        changeFeedStub.restore()
        done()
      })
    })

    it('should create store from cache', (done) => {
      const cacheGetStub = sinon.stub().resolves({})
      const cache = { get: cacheGetStub }
      let registry = new Registry({state: cache})
      const changeFeedStub = sinon.stub(registry, 'createChangeFeed')
      const reduceStub = sinon.stub(registry, 'reduce')

      registry.createStore()

      cacheGetStub.should.be.calledOnce
      setTimeout(() => {
        changeFeedStub.should.be.called
        reduceStub.should.be.called
        changeFeedStub.restore()
        reduceStub.restore()
        done()
      })
    })

    it('should create store from cache with latest seq', (done) => {
      const cacheGetStub = sinon.stub().resolves({ seq: 1, _rev: 0, state: {}})
      const cache = { get: cacheGetStub }
      let registry = new Registry({state: cache})
      const changeFeedStub = sinon.stub(registry, 'createChangeFeed')
      const reduceStub = sinon.stub(registry, 'reduce')

      registry.createStore()

      cacheGetStub.should.be.calledOnce
      setTimeout(() => {
        changeFeedStub.should.be.called
        reduceStub.should.be.called
        changeFeedStub.restore()
        reduceStub.restore()
        done()
      })
    })

  })

  describe('register', () => {
    const eventName = 'TEST'
    const testEvent = () => {}
    let registry, store, changeFeedStub

    beforeEach(() => {
      registry = new Registry({ })
      changeFeedStub = sinon.stub(registry, 'createChangeFeed')
      store = registry.createStore()
      registry.register(eventName, testEvent)
    })

    afterEach(() => {
      changeFeedStub.restore()
    })

    it('should throw on invalid arguments', () => {
      expect(() => registry.register('Invalid Event', undefined)).to.throw()
    })

    it('should register a new event handler', () => {
      registry.registry.should.have.property(eventName)
    })

    it('should assign the provided reducer', () => {
      registry.registry[eventName].should.equal(testEvent)
    })

  })

  describe('emit', () => {
    const eventName = 'TEST'
    let registry, store, source, testEvent

    beforeEach(() => {
      source = new PouchDB('testdb/test1')
      registry = new Registry({ source })
      testEvent = sinon.stub()
      store = registry.createStore()
      registry.register(eventName, testEvent)
    })

    it('should handle a fired event', () => {
      const eventName = 'TEST'
      const dispatchSpy = sinon.spy(registry.store.dispatch)
      registry.emit({ type: 'TEST' }).then()
      setTimeout(() => {
        dispatchSpy.should.be.calledOnce
        testEvent.should.be.calledOnce
      })
    })

    it('should throw on incorrect parameters', () => {
      expect(() => { registry.emit({}) }).to.throw()
    })

  })

  describe('reduce', () => {
    let registry, reduceEventStub, cacheStateStub

    beforeEach(() => {
      registry = new Registry({})

      reduceEventStub = sinon.stub(registry, 'reduceEvent')
      reduceEventStub.returns('NEW_STATE') // Fake "NEW_STATE" return value
      cacheStateStub = sinon.stub(registry, 'cacheState')
    })

    afterEach(() => {
      reduceEventStub.restore()
      cacheStateStub.restore()
    })

    it('should reduce and cache new state', () => {
      registry.reduce('OLD_STATE', { type: 'EVENT' })
      reduceEventStub.called.should.be.true // reduce event
      cacheStateStub.called.should.be.true // cache new state
    })

    it('should call cacheState with reduced state', () => {
      const returnValue = registry.reduce('OLD_STATE', { type: 'EVENT' })
      expect(cacheStateStub.calledWithExactly('NEW_STATE'))
      returnValue.should.equal('NEW_STATE')
    })

    it(`should return 'action.payload' when called with 'HYDRATE_STATE'`, () => {
      const returnValue = registry.reduce('OLD_STATE', { type: 'HYDRATE_STATE', payload: 'PAYLOAD' })
      reduceEventStub.called.should.be.false
      cacheStateStub.called.should.be.false
      returnValue.should.equal('PAYLOAD')
    })

    it(`should return 'state' when called with 'HYDRATE_STATE'`, () => {
      const returnValue = registry.reduce('OLD_STATE', { type: 'HYDRATE_STATE' })
      reduceEventStub.called.should.be.false
      cacheStateStub.called.should.be.false
      returnValue.should.equal('OLD_STATE')
    })

    it('should not cache state when state is unmodified', () => {
      // State given is the same as reduceEventStub return value
      const returnValue = registry.reduce('NEW_STATE', { type: 'EVENT', payload: 'PAYLOAD' })
      reduceEventStub.called.should.be.true
      cacheStateStub.called.should.be.false
      returnValue.should.equal('NEW_STATE')
    })

    it('should log an error if action is unrecognised', () => {
      const consoleStub = sinon.stub(console, "error")
      registry.reduce({}, { type: 'FOO' })
      consoleStub.getCall(0).args[0].startsWith('Unrecognised Action').should.be.true
      consoleStub.restore()
    })
  })

  describe('reduceEvent', () => {
    let reducerStub, registry

    beforeEach(() => {
      registry = new Registry({})
      reducerStub = sinon.stub()
      registry.registry['TEST'] = reducerStub
    })

    afterEach(() => {
      reducerStub.reset()
    })

    it('should log an error on invalid event action (undefined doc)', () => {
      const consoleStub = sinon.stub(console, "error")
      registry.reduceEvent({}, { change: { seq: 1 } })
      consoleStub.getCall(0).args[0].startsWith('Invalid event action:').should.be.true
      consoleStub.restore()
    })

    it('should log an error on invalid event action (undefined seq)', () => {
      const consoleStub = sinon.stub(console, "error")
      registry.reduceEvent({}, { change: { doc: {} } })
      consoleStub.getCall(0).args[0].startsWith('Invalid event action:').should.be.true
      consoleStub.restore()
    })

    it('should log an error on unrecognised event type', () => {
      const consoleStub = sinon.stub(console, "error")
      registry.reduceEvent({}, { change: { doc: { type: '' }, seq: 1 } })
      consoleStub.getCall(0).args[0].startsWith('Unrecognised Event').should.be.true
      consoleStub.restore()
    })

    it('should execute a registered reducer', () => {
      registry.reduceEvent({}, { change: { doc: { type: 'TEST' }, seq: 1 } })
      reducerStub.calledOnce.should.be.true
    })
  })

  describe('cacheState', () => {

    it('should return on unset flag', () => {
      let registry = new Registry({ cache: false})
      expect(registry.cacheState({})).to.be.undefined
    })

    it('should return on undefined supplied state', () => {
      let registry = new Registry({})
      expect(registry.cacheState({})).to.be.undefined
    })

    it('should return a rejected promise', () => {
      const error =  { status: 500 }
      let putStub = sinon.stub().rejects(error)
      let registry = new Registry({ state: { put : putStub } })
      return registry.cacheState({}).should.eventually.be.rejectedWith(error)
    })

    it('should retry on conflict error (409)', () => {
      const error =  { status: 409 }
      let putStub = sinon.stub()
        .onFirstCall().rejects(error)
        .resolves({ rev: 1 })
      let getStub = sinon.stub().resolves({ _rev: 1})
      let registry = new Registry({ state: { put : putStub, get: getStub } })
      registry.rev = 0
      return registry.cacheState({}).then(() =>  {
        registry.rev.should.equal(1)
        putStub.should.be.calledBefore(getStub)
      })
    })

    it('should update registry revision', () => {
      let putStub = sinon.stub().resolves({ rev: 1 })
      let registry = new Registry({ state: { put : putStub } })
      registry.rev = 0
      return registry.cacheState({}).then(() => registry.rev.should.equal(1))
    })
  })

  describe('changeFeed', () => {
    let eventName = 'TEST',
      eventStub, source, registry, store

    beforeEach(() => {
      source = new PouchDB('testdb/test1')
      registry = new Registry({ source })
      store = registry.createStore()
      eventStub = sinon.stub()
      registry.register(eventName, eventStub)
    })

    afterEach(() => {
      eventStub.reset()
    })

    it('should dispatch an event on change', () => {
      store.dispatch({ type: 'EVENT', change: { doc: { type: eventName }, seq: 1 } })
      eventStub.called.should.be.true
    })

    it('should log an error on deleted event', () => {
      const consoleStub = sinon.stub(console, "error")
      registry.feed.emit('change', { deleted: true } )
      consoleStub.getCall(0).args[0].trim().startsWith('WARNING: EVENT').should.be.true
      consoleStub.restore()
    })

    it('should end process on event feed error', () => {
      const consoleStub = sinon.stub(console, "error")
      const processExitStub = sinon.stub(process, 'exit')
      registry.feed.emit('error', {})
      consoleStub.getCall(0).args[0].trim().startsWith('EVENT FEED ERROR').should.be.true
      processExitStub.should.be.called
      processExitStub.restore()
      consoleStub.restore()
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