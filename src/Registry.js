'use strict'

/**
 * Dependencies
 * @ignore
 */
const util = require('util')
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
    const { source, state, cache = true } = options

    // Set databases from options
    Object.defineProperty(this, 'source', { value: source })
    Object.defineProperty(this, 'state', { value: state })

    // Set caching flag
    Object.defineProperty(this, 'cache', { value: cache, writable: true })

    // Create non-configurable registry
    Object.defineProperty(this, 'registry', { value: {}, enumerable: true })
  }

  /**
   * inspect
   * @ignore
   *
   * @description
   * Debug console output for registry.
   */
  [util.inspect.custom](depth, options) {
    const events = Object.keys(this.registry).join(', ')
    return `Registry { ${events} }`
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
    let { state: cache, store } = this

    if (!store) {
      // Create non-configurable redux store
      store = createStore((state = {}, action) => this.reduce(state, action), {}, enhancer)
      Object.defineProperty(this, 'store', { value: store })

      if (cache) {
        cache.get('state', { latest: true })
          .then(latest => {
            const { _rev, state, seq } = latest
            this.rev = _rev
            this.seq = seq

            store.dispatch({ type: 'HYDRATE_STATE', payload: state })
            this.createChangeFeed(latest && latest.seq ? latest.seq : 0)
          })
          .catch(() => this.createChangeFeed())
      } else {
        this.createChangeFeed()
      }
    }

    return store
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
  createChangeFeed (since = 0) {
    const registry = this
    const { source, store } = registry

    // Create feed
    const feed = source.changes({
      live: true,
      include_docs: true,
      since
    })

    Object.defineProperty(registry, 'feed', { value: feed, configurable: true })

    // Handle change
    feed.on('change', change => {
      if (change.deleted) {
        console.error(`
          WARNING: EVENT ${change.id} WAS DELETED FROM THE DATABASE.
          NO DOCUMENT SHOULD EVER BE DELETED.
          PLEASE INVESTIGATE IMMEDIATELY.
          ${JSON.stringify(change, null, 2)}
        `)
        return
      }

      store.dispatch({ type: 'EVENT', change })
    })

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
   * cacheState
   * @ignore
   *
   * @description
   * Cache the supplied state as the current latest.
   *
   * @param  {Object} state
   * @void
   */
  cacheState (state) {
    const { state: cache, cache: flag, rev, seq } = this

    if (!flag || !cache) {
      return
    }

    return cache.put({ state, _id: 'state', _rev: rev, seq })
      .catch(error => {
        const { status } = error

        if (status === 404) {
          return cache.get('state').then(({ _rev }) => {
            this.rev = _rev
            return this.cacheState(state)
          })
        }

        return Promise.reject(error)
      })
      .then(({ rev }) => this.rev = rev)
  }

  /**
   * reduce
   * @ignore
   *
   * @description
   * The reducer that is passed to the Redux store.
   * Handles root level actions and dispatches to the event reducer.
   *
   * @param  {State} state
   * @param  {Object} action
   * @return {State} New state
   */
  reduce (state, action) {
    const { type } = action

    switch (type) {
      case '@@redux/INIT':
        return state
      case 'EVENT':
        const newState = this.reduceEvent(state, action)

        // No update made
        // TODO This shouldn't cause store subscribers to fire...
        if (newState === state) {
          return state
        }

        // Cache new state
        this.cacheState(newState)
        return newState

      case 'HYDRATE_STATE':
        return action.payload || state
      default:
        console.error(`Unrecognised Action ${type}: ${JSON.stringify(action, null, 2)}`)
        return state
    }
  }

  /**
   * reduceEvent
   * @ignore
   *
   * @description
   * The reducer of the actions registered on the registry.
   *
   * @param  {State} state
   * @param  {Object} action
   * @return {State} New state
   */
  reduceEvent (state, action) {
    const { change: { doc, seq } } = action

    if (!seq || !doc) {
      console.error(`Invalid event action: ${action}`)
      return state
    }

    // Store latest `seq` for state cache
    this.seq = seq

    // Get correct reducer from registry
    const { type } = doc
    const reducer = this.registry[type]

    // Unknown event
    if (!reducer) {
      console.error(`Unrecognised Event ${type}: ${JSON.stringify(doc, null, 2)}`)
      return state
    }

    return reducer(state, doc)
  }

  /**
   * register
   *
   * @description
   * Register a reducer on the registry.
   *
   * @param  {String} event
   * @param  {Function} reducer
   * @void
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
   * @void
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
