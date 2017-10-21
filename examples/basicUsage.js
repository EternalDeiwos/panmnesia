'use strict'

/**
 * Dependencies
 * @ignore
 */
const PouchDB = require('pouchdb')
const { Registry } = require('./src')

/**
 * Registry
 *
 * Note: you must create an empty folder called "data" or this will throw
 */
const registry = new Registry({
  source: new PouchDB('data/events'),
  state: new PouchDB('data/state')
})

/**
 * Redux Store
 */
const store = registry.createStore()
store.subscribe(() => console.log('STATE', store.getState()))

/**
 * Register Reducer
 */
registry.register('foo', (state, action) => {
  console.log('FOO')
  return state
})

/**
 * Emit Event
 */
registry.emit({ type: 'foo' })
