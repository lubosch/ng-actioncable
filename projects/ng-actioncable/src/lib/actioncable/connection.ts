import { timer } from 'rxjs'
import { ConnectionMonitor } from './connection-monitor'
import { EventsHandler } from './events-handler'
import { Consumer } from './consumer'
import { Subscriptions } from './subscriptions'
import { ActionCable } from './actioncable'

export class Connection {
  reopenDelay = 500
  consumer: Consumer = null
  subscriptions: Subscriptions = null
  monitor: ConnectionMonitor = null
  disconnected: boolean = null
  actionCable: ActionCable = null
  webSocket: WebSocket = null
  eventsHandler: EventsHandler = null
  protocols: string[] = null
  supportedProtocols: string[] = []
  unsupportedProtocol: string = null

  constructor(actionCable: ActionCable, consumer: Consumer) {
    this.consumer = consumer
    this.subscriptions = this.consumer.subscriptions
    this.monitor = new ConnectionMonitor(actionCable, this)
    this.disconnected = true
    this.actionCable = actionCable
    this.eventsHandler = new EventsHandler(this)
    this.protocols = actionCable.INTERNAL.protocols

    if (2 <= this.protocols.length) {
      this.supportedProtocols = this.protocols.slice(0, this.protocols.length - 1)
      this.unsupportedProtocol = this.protocols[this.protocols.length]
    } else {
      this.supportedProtocols = []
      this.unsupportedProtocol = this.protocols[0]
    }
    this.open()
  }

  open = (): boolean => {
    if (this.isActive()) {
      this.actionCable.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`)
      return false
    } else {
      this.actionCable.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${this.protocols}`)
      if (this.webSocket != null) {
        this.uninstallEventHandlers()
      }
      this.webSocket = new WebSocket(this.consumer.url, this.protocols)
      this.installEventHandlers()
      this.monitor.start()
      return true
    }
  }

  send = (data: any): boolean => {
    if (this.isOpen()) {
      this.webSocket.send(JSON.stringify(data))
      return true
    } else {
      return false
    }
  }

  close = (opts: { allowReconnect: boolean } = { allowReconnect: true }) => {
    const allowReconnect = opts.allowReconnect
    if (!allowReconnect) {
      this.monitor.stop()
    }
    if (this.isActive()) {
      return this.webSocket != null ? this.webSocket.close() : void 0
    }
  }

  reopen = () => {
    this.actionCable.log(`Reopening WebSocket, current state is ${this.getState()}`)
    if (this.isActive()) {
      try {
        return this.close()
      } catch (error1) {
        return this.actionCable.log('Failed to reopen WebSocket', error1)
      } finally {
        this.actionCable.log(`Reopening WebSocket in ${this.reopenDelay}ms`)
        timer(this.reopenDelay).subscribe(this.open)
      }
    } else {
      return this.open()
    }
  }

  isOpen = (): boolean => this.isState('open')

  isActive = (): boolean => this.isState('open', 'connecting')

  isState = (...args): boolean => {
    const state = this.getState()
    return state && args.includes(state)
  }

  getState = (): string => {
    for (const state of Object.keys(WebSocket)) {
      const value = WebSocket[state]
      const ref1 = this.webSocket
      if (value === (ref1 != null ? ref1.readyState : void 0)) {
        return state.toLowerCase()
      }
    }
    return null
  }

  getProtocol = (): string => this.webSocket != null ? this.webSocket.protocol : void 0

  isProtocolSupported = (): boolean => {
    return this.supportedProtocols.includes(this.getProtocol())
  }

  installEventHandlers = (): void => {
    this.eventsHandler.eventsList.forEach(
      (eventName: string) => this.webSocket[`on${eventName}`] = this.eventsHandler[eventName].bind(this),
    )
  }

  uninstallEventHandlers = (): void => {
    this.eventsHandler.eventsList.forEach((eventName: string) => this.webSocket[`on${eventName}`] = () => {
    })
  }
}
