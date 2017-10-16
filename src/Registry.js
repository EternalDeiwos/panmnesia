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

    this.actions = {}
    this.selectors = {}
    Object.defineProperty(this, 'source', { value: source })
    Object.defineProperty(this, 'state', { value: state })
  }

  /**
   * createStore
   *
   * @description
   * Initialize the redux store.
   *
   * @param  {Function} enhancer - Redux enhancer to be injected.
   * @return {Store} The redux store containing the aggregate state of the event stream.
   */
  createStore (enhancer) {
    if (!this.store) {
      Object.defineProperty(this, 'store', {
        value: createStore((state, action) => this.reduce(state, action), {}, enhancer),
        enumerable: true
      })
    }

    return this.store
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
   * Register an action or selector on the registry.
   *
   * @param  {Class} actionSelector - An Action or Selector child-class.
   * @return {(Action|Selector)} An instance of the Action or Selector child-class.
   */
  register (actionSelector) {
    if (!actionSelector) {
      throw new Error('Action or Selector required')
    }

    // TODO
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Registry
