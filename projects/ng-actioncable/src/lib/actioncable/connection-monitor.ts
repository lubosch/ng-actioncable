import { timer, interval, Subscription } from 'rxjs'
import { Connection } from './connection'
import { ActionCable } from './actioncable'

export class ConnectionMonitor {
  ref: { min: number; max: number }
  startedAt: number
  stoppedAt: number
  connection: Connection
  pollTimeout: number
  poll$: Subscription
  disconnectedAt: number
  pingedAt: number
  actionCable: ActionCable
  reconnectAttempts = 0
  pollInterval = { min: 3, max: 30 }

  staleThreshold = 6

  constructor(actionCable: ActionCable, connection: Connection) {
    this.connection = connection
    this.actionCable = actionCable
    this.reconnectAttempts = 0
  }

  now = (): number => new Date().getTime()
  secondsSince = (time): number => (this.now() - time) / 1000
  clamp = (num, min, max): number => Math.max(min, Math.min(max, num))

  start = (): void => {
    if (!this.isRunning()) {
      this.startedAt = this.now()
      delete this.stoppedAt
      this.startPolling()
      document.addEventListener('visibilitychange', this.visibilityDidChange)
      return this.actionCable.log(`ConnectionMonitor started. pollInterval = ${this.getPollInterval()} ms`)
    }
  }

  stop = (): void => {
    if (this.isRunning()) {
      this.stoppedAt = this.now()
      this.stopPolling()
      document.removeEventListener('visibilitychange', this.visibilityDidChange)
      return this.actionCable.log('ConnectionMonitor stopped')
    }
  }

  isRunning = (): boolean => (this.startedAt != null) && (this.stoppedAt == null)

  recordPing = (): number => this.pingedAt = this.now()

  recordConnect = (): void => {
    this.reconnectAttempts = 0
    this.recordPing()
    delete this.disconnectedAt
    return this.actionCable.log('ConnectionMonitor recorded connect')
  }

  recordDisconnect = (): void => {
    this.disconnectedAt = this.now()
    return this.actionCable.log('ConnectionMonitor recorded disconnect')
  }

  startPolling = (): Subscription => {
    this.stopPolling()
    return this.poll$ = this.poll()
  }

  stopPolling = (): void => {
    if (this.poll$) {
      this.poll$.unsubscribe()
    }
  }

  poll = (): Subscription => {
    return interval(this.getPollInterval()).subscribe(
      () => this.reconnectIfStale(),
    )
  }

  getPollInterval = (): number => {
    const ref = this.pollInterval
    const min = ref.min
    const max = ref.max
    const cInterval = 5 * Math.log(this.reconnectAttempts + 1)
    return Math.round(this.clamp(cInterval, min, max) * 1000)
  }

  reconnectIfStale = () => {
    if (this.connectionIsStale()) {
      this.actionCable.log(
        `ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, ` +
        `pollInterval = ${this.getPollInterval()}ms, time disconnected = ${this.secondsSince(this.disconnectedAt)}s, ` +
        `stale threshold = ${this.staleThreshold}s'`,
      )
      this.reconnectAttempts++
      if (this.disconnectedRecently()) {
        return this.actionCable.log('ConnectionMonitor skipping reopening recent disconnect')
      } else {
        this.actionCable.log('ConnectionMonitor reopening')
        return this.connection.reopen()
      }
    }
  }

  connectionIsStale = (): boolean => {
    return this.secondsSince(this.pingedAt != null ? this.pingedAt : this.startedAt) > this.staleThreshold
  }

  disconnectedRecently = (): boolean => (
    this.disconnectedAt && this.secondsSince(this.disconnectedAt) < this.staleThreshold
  )

  visibilityDidChange = () => {
    if (document.visibilityState === 'visible') {
      timer(200).subscribe(
        () => {
          if (this.connectionIsStale() || !this.connection.isOpen()) {
            this.actionCable.log(
              `ConnectionMonitor reopening stale connection on visibilitychange. visbilityState = ${
                document.visibilityState}`,
            )
            return this.connection.reopen()
          }
        },
      )
    }
  }
}
