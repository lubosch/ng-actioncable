import { ActionCable } from './actioncable'
import { Connection } from './connection'
import { Subscriptions } from './subscriptions'


export class Consumer {
  url: string
  subscriptions: Subscriptions
  connection: Connection
  actionCable: ActionCable

  constructor(actionCable: ActionCable, url) {
    this.url = url
    this.actionCable = actionCable
    this.subscriptions = new Subscriptions(this)
    this.connection = new Connection(this.actionCable, this)
  }

  send = (data: any): boolean => this.connection.send(data)

  connect = (): boolean => this.connection.open()

  disconnect = (): void => this.connection.close({ allowReconnect: false })

  ensureActiveConnection = (): boolean => {
    if (!this.connection.isActive()) {
      return this.connection.open()
    }
  }
}
