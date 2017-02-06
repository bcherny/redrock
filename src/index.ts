import { Subject } from 'rx'

export interface ShouldEvent<T> {

  /**
   * Entity id that action should be applied to
   */
  id: number

  /**
   * New value
   */
  value: T
}

export interface DidEvent<T> extends ShouldEvent<T> {

  /**
   * Previous value
   */
  previousValue: T
}

interface State<Events> {
  dids: Map<keyof Events, Rx.Observable<DidEvent<any>>>
  shoulds: Map<keyof Events, Rx.Observable<ShouldEvent<any>>>
  subscriptions: Map<keyof Events, Rx.Disposable>
}

export abstract class ReactiveBus<Events> {

  private state: State<Events> = {
    dids: new Map,
    shoulds: new Map,
    subscriptions: new Map
  }

  constructor(reducers: Record<
    keyof Events,
    (data: ShouldEvent<Events[keyof Events]>) => Events[keyof Events]
  >) {
    for (const type in reducers) {
      this.registerReducer(type, reducers[type])
    }
  }

  /**
   * Emit an event
   */
  emit<T extends keyof Events>(type: T, data: ShouldEvent<Events[T]>) {
    if (!this.isEventRegistered(type)) {
      throw Error(`You must define a reducer for event "${type}" before you call #emit on it.`)
    }
    this.getShould(type)!.onNext(data)

    return this
  }

  /**
   * Respond to an event (fired after app state has been mutated)
   */
  on<T extends keyof Events>(type: T) {
    if (!this.isEventRegistered(type)) {
      throw Error(`You must define a reducer for event "${type}" before you call #on on it.`)
    }
    return this.getDid(type)!
  }

  destroy() {
    this.state.subscriptions.forEach(_ => _.dispose())
  }


  ///////////////////// privates /////////////////////

  /**
   * Mutate app state in response to an event.
   *
   * `fn` takes the `ShouldEvent`, and returns the previous value.
   */
  private registerReducer<T extends keyof Events>(type: T, fn: (data: ShouldEvent<Events[T]>) => Events[T]) {

    // create observables
    if (this.isEventRegistered(type)) {
      throw Error(`A reducer is already defined for event "${type}". You cannot define more than 1 reducer per event type.`)
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

  private createDid<T extends keyof Events>(type: T) {
    this.state.dids.set(type, new Subject<DidEvent<Events[T]>>())
  }

  private createShould<T extends keyof Events>(type: T) {
    this.state.shoulds.set(type, new Subject<ShouldEvent<Events[T]>>())
  }

  private getDid<T extends keyof Events>(type: T) {
    return this.state.dids.get(type) as Subject<DidEvent<Events[T]>>
  }

  private getShould<T extends keyof Events>(type: T) {
    return this.state.shoulds.get(type) as Subject<ShouldEvent<Events[T]>>
  }

  private isEventRegistered<T extends keyof Events>(type: T) {
    return this.state.dids.has(type)
  }
}


////// test


type Events = {
  SHOULD_OPEN_MODAL: boolean
  SHOULD_CLOSE_MODAL: boolean
}

const store: { [id: number]: boolean } = {}

class App extends ReactiveBus<Events> { }
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
