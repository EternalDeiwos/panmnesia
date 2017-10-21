'use strict'

/**
 * Dependencies
 * @ignore
 */
const { createStore } = require('redux')

/**
 * Module Dependencies
 * @ignore
 */
const id = require('./Identifier')

/**
 * @typedef {Object} State
 *
 * @description
 * An immutable Redux state object.
 */

/**
 * @typedef {Object} FluxEvent
 *
 * @description
 * An event object conforming to the Flux Event standard.
 */

/**
 * @typedef {String} RegistryType
 *
 * @description
 * A constant denoting the type of {@link Entry}.
 */

/**
 * Registry
 * @ignore
 */
class Registry {

  /**
   * @class Registry
   *
   * @classdesc
   * A registry of actions and selectors.
   *
   * @constructor
   *
   * @param  {Object} options
   * @param  {PouchDB} options.source - PouchDB instance of the event database.
   * @param  {PouchDB} [options.state] - PouchDB instance of the state cache database.
   */
  constructor (options) {
    const { source, state } = options

    // Set databases from options
    Object.defineProperty(this, 'source', { value: source })
    Object.defineProperty(this, 'state', { value: state })

    // Create non-configurable registry
    Object.defineProperty(this, 'registry', { value: {
      HYDRATE_STATE: (state, action) => action.payload
    }, enumerable: true })
  }

  /**
   * createStore
   *
   * @description
   * Initialize the redux store
   *
   * @param  {Function} enhancer - Redux enhancer to be injected.
   * @return {Store} The promise that resolves the redux store containing the aggregate state of the event stream.
   */
  createStore (enhancer) {
    if (!this.store) {
      // Create non-configurable redux store
      Object.defineProperty(this, 'store', {
        value: createStore((state = {}, action) => this.reduce(state, action), {}, enhancer)
      })

      if (this.state) {
        this.state.get('state', { latest: true })
          .catch(() => null)
          .then(latest => {
            if (latest !== null) {
              this.rev = latest._rev
              this.store.dispatch({ type: 'HYDRATE_STATE', payload: latest })
            }

            this.createChangeFeed(latest ? latest.seq : 0)
          })
      } else {
        this.createChangeFeed(0)
      }

      this.store.subscribe(() => {
        const state = this.store.getState()
        return this.state.put({ ...state, _id: 'state', _rev: this.rev })
          .catch(() => {})
      })
    }

    return this.store
  }

  /**
   * createChangeFeed
   * @ignore
   *
   * @description
   * Start the PouchDB change feed
   *
   * @param  {Number} since - Starting sequence number
   * @return {Changes} {@link https://pouchdb.com/api.html#changes|PouchDB Change Feed}
   */
  createChangeFeed (since) {
    const { source, store } = this

    // Create feed
    const feed = source.changes({
      live: true,
      include_docs: true,
      since
    })

    Object.defineProperty(this, 'feed', { value: feed, configurable: true })

    // Handle change
    feed.on('change', change => store.dispatch({ type: 'EVENT', change }))

    // Handle error
    // TODO Fail gracefully
    feed.on('error', error => {
      console.error('EVENT FEED ERROR', error)
      process.exit(1)
    })

    return feed
  }

  /**
   * @description
   * Get the redux store
   *
   * @return {ReduxStore}
   */
  getStore () {
    return this.store || null
  }

  /**
   * reduce
   * @ignore
   *
   * @description
   * The reducer of the actions registered on the registry.
   *
   * @param  {State} state
   * @param  {Object} action
   * @return {State} New state
   */
  reduce (state, action) {
    if (action.type !== 'EVENT') {
      return state
    }

    const { change: { doc, seq } } = action

    if (!seq || !doc) {
      return state
    }

    const { type } = doc
    const reducer = this.registry[type]

    if (!reducer) {
      return state
    }

    return Object.assign(reducer(state, doc), { seq })
  }

  /**
   * register
   *
   * @description
   * Register a reducer on the registry.
   *
   * @param  {String} event
   * @param  {Function} reducer
   */
  register (event, reducer) {
    if (!event || !reducer) {
      throw new Error('Invalid arguments')
    }

    this.registry[event] = reducer
  }

  /**
   * emit
   *
   * @description
   * Write an event to the event stream.
   *
   * @param  {Object} event
   * @param  {String} event.type
   * @param  {Object} [event.payload]
   * @param  {Boolean} [event.error]
   * @param  {Object} [event.meta]
   */
  emit (event) {
    if (!event || !event.type) {
      throw new Error('Event type is required')
    }

    const { type, payload, error, meta } = event
    const { source } = this
    return source.put({ type, payload, error, meta, _id: id() })
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Registry
