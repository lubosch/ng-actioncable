import { Injectable } from '@angular/core'
import { Cable } from './actioncable/cable'

@Injectable({
  providedIn: 'root',
})
export class NgActioncableService {
  private cables: { [s: string]: Cable } = {}

  /**
   * Open a new ActionCable connection to the url. Any number of connections can be created.
   */
  cable(url: string, params?: any): Cable {
    if (!this.cables.hasOwnProperty(url)) {
      this.cables[url] = new Cable(url, params)
    }

    return this.cables[url]
  }

  /**
   * Close an open connection for the url.
   */
  disconnect(url: string): void {
    if (this.cables.hasOwnProperty(url)) {
      this.cables[url].disconnect()
      delete this.cables[url]
    }
  }
}
