import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDisplay } from './customer-display';

/**
 * CustomerDisplay uses ResizeObserver to notice when its order grids change size and reflow.
 * The test environment (jsdom) has no real ResizeObserver, so this stub stands in — it does
 * nothing, but lets the page load in tests without crashing.
 */
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('CustomerDisplay', () => {
  let component: CustomerDisplay;
  let fixture: ComponentFixture<CustomerDisplay>;

  beforeEach(async () => {
    // Tell the test runner to use our stub whenever CustomerDisplay asks for a ResizeObserver.
    globalThis.ResizeObserver = ResizeObserverStub;

    await TestBed.configureTestingModule({
      imports: [CustomerDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
