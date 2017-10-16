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
 * Constants
 * @ignore
 */
const ACTION_REGISTRY_TYPE = "ACTION"

/**
 * Action
 *
 * @class Action
 * @classdesc
 * An abstract Action event handler.
 *
 * @hideconstructor
 *
 * @extends {Entry}
 */
class Action extends Entry {

  /**
   * @static
   * @constant
   * @return {RegistryType}
   */
  static get registryType () {
    return Registry.ACTION_REGISTRY_TYPE
  }
}

/**
 * Exports
 * @ignore
 */
module.exports = Action
