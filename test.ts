import test from 'ava'
import { Emitter } from './'

type Actions = {
  SHOULD_OPEN_MODAL: boolean
  SHOULD_CLOSE_MODAL: boolean
}

const store: { [id: number]: boolean } = {
  123: false
}

class App extends Emitter<Actions> { }
const app = new App({
  SHOULD_CLOSE_MODAL: ({ id, value }) => {
    const previousValue = store[id]
    store[id] = value
    return previousValue
  },
  SHOULD_OPEN_MODAL: ({ id, value }) => {
    const previousValue = store[id]
    store[id] = value
    return previousValue
  }
})

test('it should trigger subscribers', t => {
  t.plan(3)
  app.on('SHOULD_OPEN_MODAL').subscribe(_ => {
    t.is(_.id, 123)
    t.is(_.previousValue, false)
    t.is(_.value, true)
  })
  app.dispatch('SHOULD_OPEN_MODAL', { id: 123, value: true })
})
