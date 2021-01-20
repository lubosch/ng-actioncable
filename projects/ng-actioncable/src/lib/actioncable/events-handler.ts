import { ActionCable } from './actioncable'
import { Connection } from './connection'

export class EventsHandler {
  actionCable: ActionCable
  connection: Connection
  messageTypes: { [key: string]: string }
  eventsList: string[] = ['message', 'open', 'close', 'error']

  constructor(connection: Connection) {
    this.connection = connection
    this.actionCable = this.connection.actionCable
    this.messageTypes = this.actionCable.INTERNAL.messageTypes
  }

  message = (event: { data: string }) => {
    if (!this.connection.isProtocolSupported()) {
      return
    }
    const data = JSON.parse(event.data)
    const identifier = data.identifier
    const message = data.message
    const type = data.type
    switch (type) {
      case this.messageTypes.welcome:
        this.connection.monitor.recordConnect()
        return this.connection.subscriptions.reload()
      case this.messageTypes.ping:
        return this.connection.monitor.recordPing()
      case this.messageTypes.confirmation:
        return this.connection.subscriptions.notify(identifier, 'connected')
      case this.messageTypes.rejection:
        return this.connection.subscriptions.reject(identifier)
      default:
        return this.connection.subscriptions.notify(identifier, 'received', message)
    }
  }
  open = (): void => {
    this.actionCable.log(`WebSocket onopen event, using '${this.connection.getProtocol()}' subprotocol`)
    this.connection.disconnected = false
    if (!this.connection.isProtocolSupported()) {
      this.actionCable.log('Protocol is unsupported. Stopping monitor and disconnecting.')
      this.connection.close({ allowReconnect: false })
    }
  }
  close = () => {
    this.actionCable.log('WebSocket onclose event')
    if (this.connection.disconnected) {
      return
    }
    this.connection.disconnected = true
    this.connection.monitor.recordDisconnect()
    return this.connection.subscriptions.notifyAll('disconnected', {
      willAttemptReconnect: this.connection.monitor.isRunning(),
    })
  }
  error = (): void => this.actionCable.log('WebSocket onerror event')
}
