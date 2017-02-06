import { Emitter } from '../src'

type Actions = {
  SHOULD_OPEN_MODAL: boolean
  SHOULD_CLOSE_MODAL: boolean
}

const store: { [id: number]: boolean } = {}

class App extends Tdux<Actions> { }
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

app.on('SHOULD_OPEN_MODAL').subscribe(_ => console.log(_.value))

app.dispatch('SHOULD_OPEN_MODAL', { id: 123, value: true })
