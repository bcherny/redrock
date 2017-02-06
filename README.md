# rxm [![Build Status][build]](https://circleci.com/gh/bcherny/rxm) [![npm]](https://www.npmjs.com/package/rxm) [![mit]](https://opensource.org/licenses/MIT)

[build]: https://img.shields.io/circleci/project/bcherny/rxm.svg?branch=master&style=flat-square
[npm]: https://img.shields.io/npm/v/rxm.svg?style=flat-square
[mit]: https://img.shields.io/npm/l/rxm.svg?style=flat-square

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

## Overview



## Installation

```sh
npm install rxm --save
```

## Usage

```ts
import { ReactiveBus } from 'rxm'

// mock store
const store: { [id: number]: boolean } = {}

// enumerate actions
type Actions = {
  OPEN_MODAL: boolean
  CLOSE_MODAL: boolean
}

// define RXS bus
class App extends ReactiveBus<Actions> { }

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
app.on('OPEN_MODAL').subscribe(_ => _.value)
```

## Tests

```sh
npm test
```
