import { Consumer } from './consumer'

export class ActionCable {
  INTERNAL = {
    messageTypes: {
      welcome: 'welcome',
      ping: 'ping',
      confirmation: 'confirm_subscription',
      rejection: 'reject_subscription',
    },
    default_mount_path: '/cable',
    protocols: ['actioncable-v1-json', 'actioncable-unsupported'],
  }
  WebSocket = null
  debugging = false
  logger = console

  createConsumer = (url: string): Consumer => {
    if (url == null) {
      const ref = this.getConfig('url')
      url = (ref != null ? ref : this.INTERNAL.default_mount_path)
    }
    return new Consumer(this, this.createWebSocketURL(url))
  }

  getConfig = (name) => {
    const element = document.head.querySelector(`meta[name='action-cable-${name}']`)
    return element != null ? element.getAttribute('content') : void 0
  }

  createWebSocketURL = (url: string): string => {
    let a
    if (url && !/^wss?:/i.test(url)) {
      a = document.createElement('a')
      a.href = url
      a.protocol = a.protocol.replace('http', 'ws')
      return a.href
    } else {
      return url
    }
  }

  startDebugging = (): boolean => this.debugging = true
  stopDebugging = (): boolean => this.debugging = null
  log = (...args) => {
    let messages
    messages = 1 <= args.length ? args.slice(0) : []
    if (this.debugging) {
      messages = [...messages, Date.now()]
      const ref = this.logger
      return ref.log.apply(ref, ['[ActionCable]'].concat(messages.slice()))
    }
  }
}
