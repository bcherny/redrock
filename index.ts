import { Observable, Subject, Subscription } from 'rxjs'

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
  dids: Map<keyof Actions, Observable<DidAction<any>>>
  shoulds: Map<keyof Actions, Observable<ShouldAction<any>>>
  subscriptions: Map<keyof Actions, Subscription>
}

export abstract class Emitter<Actions> {

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
   * Dispatch an action
   */
  dispatch<T extends keyof Actions>(type: T, data: ShouldAction<Actions[T]>) {
    if (!this.isActionRegistered(type)) {
      throw Error(`You must define a reducer for action "${type}" before you call #emit on it.`)
    }
    this.getShould(type)!.next(data)

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
    this.state.subscriptions.forEach(_ => _.unsubscribe())
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
      this.getDid(type)!.next({
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
