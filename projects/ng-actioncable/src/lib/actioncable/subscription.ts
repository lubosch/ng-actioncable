import { Consumer } from './consumer'

export class Subscription {
  consumer: Consumer = null
  identifier: any = null

  constructor(consumer: Consumer, params: any, mixin: object) {
    this.consumer = consumer
    if (params == null) {
      params = {}
    }
    this.identifier = JSON.stringify(params)
    this.extend(this, mixin)
  }

  perform = (action, data: any): boolean => {
    if (data == null) {
      data = {}
    }
    data.action = action
    return this.send(data)
  }

  send = (data: any): boolean => {
    return this.consumer.send({
      command: 'message',
      identifier: this.identifier,
      data: JSON.stringify(data),
    })
  }

  unsubscribe = () => this.consumer.subscriptions.remove(this)

  extend = (object, properties): object => {
    if (properties != null) {
      for (const key of Object.keys(properties)) {
        object[key] = properties[key]
      }
    }
    return object
  }
}
