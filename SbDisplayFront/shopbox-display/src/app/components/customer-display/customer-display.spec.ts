import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerDisplay } from './customer-display';

describe('CustomerDisplay', () => {
  let component: CustomerDisplay;
  let fixture: ComponentFixture<CustomerDisplay>;

  beforeEach(async () => {
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
