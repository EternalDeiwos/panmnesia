'use strict'

/**
 * Dependencies
 * @ignore
 */
const { createStore } = require('redux')

/**
 * Registry
 * @ignore
 */
class Registry {

  /**
   * constructor
   *
   * @class Registry
   *
   * @description
   * A registry of actions and selectors.
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
    Object.defineProperty(this, 'registry', { value: {}, enumerable: true })
  }

  /**
   * createStore
   *
   * @description
   * Initialize the redux store.
   *
   * @param  {Function} enhancer - Redux enhancer to be injected.
   * @return {Promise.<Store>} The promise that resolves the redux store containing the aggregate state of the event stream.
   */
  createStore (enhancer) {
    if (!this.store) {
      // Create non-configurable redux store
      Object.defineProperty(this, 'store', {
        value: createStore((state, action) => this.reduce(state, action), {}, enhancer),
        enumerable: true
      })
    }

    return Promise.resolve(this.store)
  }

  /**
   * reduce
   *
   * @description
   * The reducer of the actions registered on the registry.
   *
   * @internal For internal use with the redux store only.
   *
   * @param  {Object} state - Current state
   * @param  {Object} action - Flux event object
   * @return {Object} New state
   */
  reduce (state, action) {
    // TODO
  }

  /**
   * register
   *
   * @description
   * Register an Entry on the registry.
   *
   * @param  {Class} Entry - An {@link ExtendedAction} or {@link ExtendedSelector} class.
   */
  register (Entry) {
    if (!Entry) {
      throw new Error('Registry Entry required')
    }

    const { type } = Entry
    this.registry[type] = new Entry(this)
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Registry
