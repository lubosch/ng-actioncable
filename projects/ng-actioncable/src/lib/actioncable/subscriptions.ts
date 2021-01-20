import { Consumer } from './consumer'
import { Subscription } from './subscription'

export class Subscriptions {
  consumer: Consumer = null
  subscriptions: Subscription[] = null

  constructor(consumer: Consumer) {
    this.consumer = consumer
    this.subscriptions = []
  }

  create = (channelName: string | { channel: string }, mixin): Subscription => {
    const channel = channelName
    const params = typeof channel === 'object' ? channel : { channel }
    const subscription = new Subscription(this.consumer, params, mixin)
    return this.add(subscription)
  }

  add = (subscription: Subscription): Subscription => {
    this.subscriptions = [...this.subscriptions, subscription]
    this.consumer.ensureActiveConnection()
    this.notify(subscription, 'initialized')
    this.sendCommand(subscription, 'subscribe')
    return subscription
  }

  remove = (subscription: Subscription): Subscription => {
    this.forget(subscription)
    if (!this.findAll(subscription.identifier).length) {
      this.sendCommand(subscription, 'unsubscribe')
    }
    return subscription
  }

  reject = (identifier: string): Subscription[] => {
    const ref = this.findAll(identifier)
    let results = []
    const len = ref.length
    for (let i = 0; i < len; i++) {
      const subscription = ref[i]
      this.forget(subscription)
      this.notify(subscription, 'rejected')
      results = [...results, subscription]
    }
    return results
  }

  forget = (subscription: Subscription): Subscription => {
    const subscriptions = this.subscriptions
    const len = subscriptions.length
    let results = []
    for (let i = 0; i < len; i++) {
      const s = subscriptions[i]
      if (s !== subscription) {
        results = [...results, s]
      }
    }
    this.subscriptions = results
    return subscription
  }

  findAll = (identifier: string): Subscription[] => {
    const subscriptions = this.subscriptions
    const len = subscriptions.length
    let results = []
    for (let i = 0; i < len; i++) {
      const s = subscriptions[i]
      if (s.identifier === identifier) {
        results = [...results, s]
      }
    }
    return results
  }

  reload = (): Subscription[] => {
    const subscriptions = this.subscriptions
    let results = []
    const len = subscriptions.length
    for (let i = 0; i < len; i++) {
      const subscription = subscriptions[i]
      results = [...results, this.sendCommand(subscription, 'subscribe')]
    }
    return results
  }

  notifyAll = (callbackName: string, ...args): Subscription[] => {
    const subscriptions = this.subscriptions
    const len = subscriptions.length
    let results = []
    for (let i = 0; i < len; i++) {
      const subscription = subscriptions[i]
      results = [...results, this.notify(subscription, callbackName, ...args)]
    }
    return results
  }

  notify = (subscription: Subscription, callbackName: string, ...args): Subscription[] => {
    let subscriptions
    if (typeof subscription === 'string') {
      subscriptions = this.findAll(subscription)
    } else {
      subscriptions = [subscription]
    }
    let results = []
    const len = subscriptions.length
    for (let i = 0; i < len; i++) {
      subscription = subscriptions[i]
      results = [
        ...results,
        typeof subscription[callbackName] === 'function' ?
          subscription[callbackName].apply(subscription, args) :
          void 0,
      ]
    }
    return results
  }

  sendCommand = (subscription, command): boolean => {
    const identifier = subscription.identifier
    return this.consumer.send({ command, identifier })
  }
}
