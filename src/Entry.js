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
}

/**
 * Exports
 * @ignore
 */
module.exports = Entry
