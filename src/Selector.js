'use strict'

/**
 * Dependencies
 * @ignore
 */

/**
 * Module Dependencies
 * @ignore
 */
const Entry = require('./Entry')
const Registry = require('./Registry')

/**
 * Selector
 *
 * @class Selector
 * @classdesc
 * An abstract Selector query.
 *
 * @hideconstructor
 *
 * @extends {Entry}
 */
class Selector extends Entry {

  /**
   * @static
   * @constant
   * @return {RegistryType}
   */
  static get registryType () {
    return Registry.SELECTOR_REGISTRY_TYPE
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Selector
