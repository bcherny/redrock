import { Observable, Subject, Subscription } from 'rxjs'

export interface ShouldAction<T, IDType> {

  /**
   * Entity id that action should be applied to
   */
  id: IDType

  /**
   * New value
   */
  value: T
}

export interface DidAction<T, IDType> extends ShouldAction<T, IDType> {

  /**
   * Previous value
   */
  previousValue: T
}

interface State<Actions, IDType> {
  dids: Map<keyof Actions, Observable<DidAction<any, IDType>>>
  shoulds: Map<keyof Actions, Observable<ShouldAction<any, IDType>>>
  subscriptions: Map<keyof Actions, Subscription>
}

export type Reducers<Actions, IDType> = Record<
  keyof Actions,
  (data: ShouldAction<Actions[keyof Actions], IDType>) => Actions[keyof Actions]
>

export abstract class Emitter<Actions, IDType> {

  private emitterState: State<Actions, IDType> = {
    dids: new Map,
    shoulds: new Map,
    subscriptions: new Map
  }

  constructor(reducers: Reducers<Actions, IDType>) {
    for (const type in reducers) {
      if (reducers.hasOwnProperty(type)) {
        this.registerReducer(type, reducers[type])
      }
    }
  }

  /**
   * Dispatch an action
   */
  dispatch<T extends keyof Actions>(type: T, data: ShouldAction<Actions[T], IDType>) {
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
    this.emitterState.subscriptions.forEach(_ => _.unsubscribe())
  }


  ///////////////////// privates /////////////////////

  /**
   * Mutate app state in response to an action.
   *
   * `fn` takes the `ShouldAction`, and returns the previous value.
   */
  private registerReducer<T extends keyof Actions>(type: T, fn: (data: ShouldAction<Actions[T], IDType>) => Actions[T]) {

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
    this.emitterState.dids.set(type, new Subject<DidAction<Actions[T], IDType>>())
  }

  private createShould<T extends keyof Actions>(type: T) {
    this.emitterState.shoulds.set(type, new Subject<ShouldAction<Actions[T], IDType>>())
  }

  private getDid<T extends keyof Actions>(type: T) {
    return this.emitterState.dids.get(type) as Subject<DidAction<Actions[T], IDType>>
  }

  private getShould<T extends keyof Actions>(type: T) {
    return this.emitterState.shoulds.get(type) as Subject<ShouldAction<Actions[T], IDType>>
  }

  private isActionRegistered<T extends keyof Actions>(type: T) {
    return this.emitterState.dids.has(type)
  }
}
