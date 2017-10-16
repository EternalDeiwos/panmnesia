'use strict'

/**
 * Dependencies
 * @ignore
 */
const uuid = require('uuid/v1')

/**
 * Exports
 * @ignore
 */
module.exports = () => {
  const id = uuid().split('-')
  return [id[2], id[1], id[0], id[3], id[4]].join('')
}
