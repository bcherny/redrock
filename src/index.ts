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

  /**
   * Emit an event
   */
  emit<T extends keyof Events>(type: T, data: ShouldEvent<Events[T]>) {
    return this.bus.onNext(data)
  }

  /**
   * Mutate app state in response to an event
   */
  reducer<T extends keyof Events>(type: T, fn: (data: ShouldEvent<Events[T]>) => any) {

    // create observables
    if (this.hasDid(type)) throw Error(`A reducer is already defined for event "${type}". You cannot define more than 1 reducer per event type.`)
    this.createDid(type)
    this.createShould(type)

    this.getShould(type)!.subscribe(data => {
      fn(data)
      this.getDid(type)!.onNext(data)
    })
  }

  /**
   * Respond to an event (fired after app state has been mutated)
   */
  on<T extends keyof Events>(type: T) {
    return new Subject<DidEvent<Events[T]>>()
  }

  destroy() {
    this.state.subscriptions.forEach(_ => _.dispose())
  }


  ///////////////////// privates /////////////////////


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

  private hasDid<T extends keyof Events>(type: T) {
    return this.state.dids.has(type)
  }
}



////// test

type Events = {
  SHOULD_OPEN_MODAL: boolean
  SHOULD_CLOSE_MODAL: boolean
}

class App extends ReactiveBus<Events> { }
const app = new App

app.emit('SHOULD_OPEN_MODAL', { id: 123, value: true })
app.reducer('SHOULD_OPEN_MODAL', data => {

})
app.on('SHOULD_OPEN_MODAL').subscribe(_ => _.value)
