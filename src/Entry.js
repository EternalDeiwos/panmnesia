'use strict'

/**
 * Entry
 * @ignore
 */
class Entry {

  /**
   * @class Entry
   * @classdesc
   * An abstract registry entry.
   *
   * <strong>Note: This API is for internal use only.</strong>
   *
   * @param  {Registry} registry
   */
  constructor (registry) {
    this.registry = registry
  }

  /**
   * @static
   * @constant
   * @abstract
   *
   * @description
   * Registry identifier
   *
   * @return {String}
   */
  static get type () {
    throw new Error('Abstract method must be overriden')
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Entry
