'use strict'

/**
 * Dependencies
 * @ignore
 */
const PouchDB = require('pouchdb')

/**
 * Replicate to Remote Instance
 */
new PouchDB('data/events_user').replicate.to('http://localhost:5984/events')
new PouchDB('data/state_user').replicate.to('http://localhost:5984/state')
