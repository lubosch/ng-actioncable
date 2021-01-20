import { TestBed } from '@angular/core/testing'

import { NgActioncableService } from './ng-actioncable.service'

describe('NgActioncableService', () => {
  let service: NgActioncableService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    service = TestBed.inject(NgActioncableService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })
})
