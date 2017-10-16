'use strict'

/**
 * Dependencies
 * @ignore
 */
const { createStore } = require('redux')

/**
 * Constants
 * @ignore
 */
const ACTION_REGISTRY_TYPE = 'ACTION'
const SELECTOR_REGISTRY_TYPE = 'SELECTOR'

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
    Object.defineProperty(this, 'registry', { value: {}, enumerable: true })
  }

  /**
   * @static
   * @constant
   * @type RegistryType
   */
  static get ACTION_REGISTRY_TYPE () {
    return ACTION_REGISTRY_TYPE
  }

  /**
   * @static
   * @constant
   * @type RegistryType
   */
  static get SELECTOR_REGISTRY_TYPE () {
    return SELECTOR_REGISTRY_TYPE
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
   * @param  {State} state
   * @param  {FluxEvent} action
   * @return {State} New state
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
