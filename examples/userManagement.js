'use strict'

/**
 * Dependencies
 * @ignore
 */
const PouchDB = require('pouchdb')
const uuid = require('uuid/v4')
const { Registry } = require('../src')

/**
 * generated ID
 */
const generatedID = uuid()

/**
 * Registry
 *
 * Note: you must create an empty folder called "data" or this will throw
 */
const registry = new Registry({
  source: new PouchDB('data/events_user'),
  state: new PouchDB('data/state_user')
})

/**
 * Redux Store
 */
const store = registry.createStore()
store.subscribe(() => console.log('STATE', store.getState()))

/**
 * Register Reducer
 */
registry.register('ADD_USER', (state, action) => {
  const { users = {} } = state
  const { type, payload: { username, email, eye_colour, id } } = action
  console.log(type)

  return {
    ...state,
    users: {
      ...users,
      [id]: {
        username,
        email,
        eye_colour,
        id
      }
    }
  }
})

registry.register('UPDATE_USER', (state, action) => {
  const { users } = state
  const { type, payload: { username, email, id } } = action
  console.log(type)

  if (!users) {
    console.error('No Users')
    return state
  }

  if (!id) {
    console.error('User ID required for update action')
    return state
  }

  const { [id]: user } = users

  if (!user) {
    console.error(`User ${id} doesn't exist`)
    return state
  }

  const updatedUser = { ...user }

  if (username) {
    updatedUser.username = username
  }

  if (email) {
    updatedUser.email = email
  }

  return {
    ...state,
    users: {
      ...users,
      [id]: updatedUser
    }
  }
})

/**
 * Emit Event
 */
registry.emit({ type: 'ADD_USER', payload: { username: 'EternalDeiwos', email: 'foo@bar.com', eye_colour: 'brown', id: generatedID } })
registry.emit({ type: 'UPDATE_USER', payload: { email: 'foo@bar.io', id: generatedID } })
