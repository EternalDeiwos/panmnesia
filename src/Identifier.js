'use strict'

/**
 * Dependencies
 * @ignore
 */
const uuid = require('uuid/v1')

/**
 * createIndexableIdentifier
 * @private
 *
 * @description
 * Mutate a freshly generated UUIDv1 into a time-based indexable identitifer string.
 *
 * @return {String}
 */
const createIndexableIdentifier = () => {
  const id = uuid().split('-')
  return [id[2], id[1], id[0], id[3], id[4]].join('')
}

/**
 * Exports
 * @ignore
 */
module.exports = createIndexableIdentifier
