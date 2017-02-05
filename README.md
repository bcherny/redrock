# rxm [![Build Status][build]](https://circleci.com/gh/bcherny/rxm) [![npm]](https://www.npmjs.com/package/rxm) [![mit]](https://opensource.org/licenses/MIT)

[build]: https://img.shields.io/circleci/project/bcherny/rxm.svg?branch=master&style=flat-square
[npm]: https://img.shields.io/npm/v/rxm.svg?style=flat-square
[mit]: https://img.shields.io/npm/l/rxm.svg?style=flat-square

> Better, Type Safe Redux.

## Installation

```sh
npm install rxm --save
```

## Usage

```ts
import { ReactiveBus } from 'rxm'

type Events = {
  SHOULD_OPEN_MODAL: boolean
  SHOULD_CLOSE_MODAL: boolean
}

class App extends ReactiveBus<Events> { }
const app = new App

app.emit('SHOULD_OPEN_MODAL', { id: 123, value: true })
app.reducer('SHOULD_OPEN_MODAL', data => { ... })
app.on('SHOULD_OPEN_MODAL').subscribe(_ => _.value)
```

## Tests

```sh
npm test
```
