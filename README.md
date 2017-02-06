# tdux [![Build Status][build]](https://circleci.com/gh/bcherny/tdux) [![npm]](https://www.npmjs.com/package/tdux) [![mit]](https://opensource.org/licenses/MIT)

[build]: https://img.shields.io/circleci/project/bcherny/tdux.svg?branch=master&style=flat-square
[npm]: https://img.shields.io/npm/v/tdux.svg?style=flat-square
[mit]: https://img.shields.io/npm/l/tdux.svg?style=flat-square

> Better, Type Safe Redux.

## Highlights

- 100% type-safe:
  - Statically guarantees that a reducer is defined for each Action
  - Statically guarantees that emitters are called with the correct Action data given their Action name
  - Statically guarantees that listeners are called with the correct Action data given their Action name
- Mental model similar to [Redux](https://github.com/reactjs/redux):
  - With several improvements over Redux:
    - Store is decoupled from emitter
    - Emitters are reactive; in fact, they use [Rx](https://github.com/Reactive-Extensions/RxJS) Observables!
    - Listeners are on specific Actions
    - Listeners are called with both current and previous values (convenience borrowed from Angular $watch/Object.Observe)

## Conceptual Overview

1. Create a Tdux `Emitter` with a set of supported `Action`s
2. Register reducers on it (a "reducer" is a mapping from a given `Action` to its side effects)
3. Components in your app can `dispatch` `Action`s on your emitter
4. `Actions` first trigger side-effects (via their respective reducers), then trigger any callbacks listening on that `Action`

## Installation

```sh
npm install tdux --save
```

## Usage

```ts
import { Emitter } from 'tdux'

// mock store
const store: { [id: number]: boolean } = {}

// enumerate actions
type Actions = {
  OPEN_MODAL: boolean
  CLOSE_MODAL: boolean
}

// define Tdux Emitter
class App extends Emitter<Actions> { }

// create bus and register reducers
const app = new App({
  CLOSE_MODAL: ({ id, value }) => {
    const previousValue = store[id]
    store[id] = value
    return previousValue
  },
  OPEN_MODAL: ({ id, value }) => {
    const previousValue = store[id]
    store[id] = value
    return previousValue
  }
})

// trigger an action
app.emit('OPEN_MODAL', { id: 123, value: true })

// listen on an action
app.on('OPEN_MODAL')
   .subscribe(_ => _.value)

// listen (advanced)
app.on('CLOSE_MODAL')
   .filter(_ => _.id === 42)
   .debounce()
   .subscribe(_ => console.log('modal closed!', _.value, _.previousValue))
```

## Tests

```sh
npm test
```
