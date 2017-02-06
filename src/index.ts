import { Subject } from 'rx'

export interface ShouldAction<T> {

  /**
   * Entity id that action should be applied to
   */
  id: number

  /**
   * New value
   */
  value: T
}

export interface DidAction<T> extends ShouldAction<T> {

  /**
   * Previous value
   */
  previousValue: T
}

interface State<Actions> {
  dids: Map<keyof Actions, Rx.Observable<DidAction<any>>>
  shoulds: Map<keyof Actions, Rx.Observable<ShouldAction<any>>>
  subscriptions: Map<keyof Actions, Rx.Disposable>
}

export abstract class ReactiveBus<Actions> {

  private state: State<Actions> = {
    dids: new Map,
    shoulds: new Map,
    subscriptions: new Map
  }

  constructor(reducers: Record<
    keyof Actions,
    (data: ShouldAction<Actions[keyof Actions]>) => Actions[keyof Actions]
  >) {
    for (const type in reducers) {
      this.registerReducer(type, reducers[type])
    }
  }

  /**
   * Emit an action
   */
  emit<T extends keyof Actions>(type: T, data: ShouldAction<Actions[T]>) {
    if (!this.isActionRegistered(type)) {
      throw Error(`You must define a reducer for action "${type}" before you call #emit on it.`)
    }
    this.getShould(type)!.onNext(data)

    return this
  }

  /**
   * Respond to an action (fired after app state has been mutated)
   */
  on<T extends keyof Actions>(type: T) {
    if (!this.isActionRegistered(type)) {
      throw Error(`You must define a reducer for action "${type}" before you call #on on it.`)
    }
    return this.getDid(type)!
  }

  destroy() {
    this.state.subscriptions.forEach(_ => _.dispose())
  }


  ///////////////////// privates /////////////////////

  /**
   * Mutate app state in response to an action.
   *
   * `fn` takes the `ShouldAction`, and returns the previous value.
   */
  private registerReducer<T extends keyof Actions>(type: T, fn: (data: ShouldAction<Actions[T]>) => Actions[T]) {

    // create observables
    if (this.isActionRegistered(type)) {
      throw Error(`A reducer is already defined for action "${type}". You cannot define more than 1 reducer per action type.`)
    }
    this.createDid(type)
    this.createShould(type)

    this.getShould(type)!.subscribe(data => {
      const previousValue = fn(data)
      this.getDid(type)!.onNext({
        id: data.id,
        previousValue,
        value: data.value
      })
    })

    return this
  }

  private createDid<T extends keyof Actions>(type: T) {
    this.state.dids.set(type, new Subject<DidAction<Actions[T]>>())
  }

  private createShould<T extends keyof Actions>(type: T) {
    this.state.shoulds.set(type, new Subject<ShouldAction<Actions[T]>>())
  }

  private getDid<T extends keyof Actions>(type: T) {
    return this.state.dids.get(type) as Subject<DidAction<Actions[T]>>
  }

  private getShould<T extends keyof Actions>(type: T) {
    return this.state.shoulds.get(type) as Subject<ShouldAction<Actions[T]>>
  }

  private isActionRegistered<T extends keyof Actions>(type: T) {
    return this.state.dids.has(type)
  }
}


////// test


type Actions = {
  SHOULD_OPEN_MODAL: boolean
  SHOULD_CLOSE_MODAL: boolean
}

const store: { [id: number]: boolean } = {}

class App extends ReactiveBus<Actions> { }
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

app.emit('SHOULD_OPEN_MODAL', { id: 123, value: true })
app.on('SHOULD_OPEN_MODAL').subscribe(_ => _.value)
