# NgActioncable

Simple and flexible integration for ActionCable and Angular applications.
Fully supports angular universal and es6.

## Install

```bash
npm install ng-actioncable
```
[![npm](https://img.shields.io/badge/npm-v0.10.6-blue.svg)](https://nodei.co/npm/ng-actioncable/)

## Usage

Use the ActionCableService to create an ActionCable consumer and subscribe to a channel.

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NgActioncableService, Channel } from 'ng-actioncable';
import { MessageService } from './shared/messages/message.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  subscription: Subscription;

  constructor(
    private cableService: NgActioncableService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    // Open a connection and obtain a reference to the channel
    const channel: Channel = this.cableService
      .cable('ws://cable.example.com')
      .channel('ChatChannel', {room : 'Best Room'});

    // Subscribe to incoming messages
    this.subscription = channel.received().subscribe(message => {
        this.messageService.notify(message);
    });
  }

  ngOnDestroy() {
    // Unsubscribing from the messages Observable automatically
    // unsubscribes from the ActionCable channel as well
    this.subscription.unsubscribe();
  }
}
```

## API

### ActionCableService
#### ``.cable(url: string, params?: any): Cable``
Open a new ActionCable connection to the url. Any number of connections can be created.  
If a function is supplied for the URL params, it will be reevaluated before any reconnection attempts.
####

#### ``.disconnect(url: string): void``
Close an open connection for the url.
####

### Cable
#### ``.channel(name: string, params?: any): Channel``
Create a new subscription to a channel, optionally with topic parameters.
####

#### ``.disconnect(): void``
Close the connection.
####

#### ``.disconnected(): Observable<any>``
Emits when the WebSocket connection is closed.
####

### Channel
#### ``.received(): Observable<any>``
Emits messages that have been broadcast to the channel.  
For easy clean-up, when this Observable is completed the ActionCable channel will also be closed.
####

#### ``.send(data: any): void``
Broadcast message to other clients subscribed to this channel.
####

#### ``.perform(action: string, data?: any): void``
Perform a channel action with the optional data passed as an attribute.
####

#### ``.initialized(): Observable<any>``
Emits when the subscription is initialized.
####

#### ``.connected(): Observable<any>``
Emits when the subscription is ready for use on the server.
####

#### ``.disconnected(): Observable<any>``
Emits when the WebSocket connection is closed.
####

#### ``.rejected(): Observable<any>``
Emits when the subscription is rejected by the server.
####

#### ``.unsubscribe(): void``
Unsubscribe from the channel.
####

## Build

Run `ng build ng-actioncable` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build ng-actioncable`, go to the dist folder `cd dist/ng-actioncable` and run `npm publish`.

## Running unit tests

Run `ng test ng-actioncable` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
