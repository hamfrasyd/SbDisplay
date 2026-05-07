import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDisplay } from './employee-display';

describe('EmployeeDisplay', () => {
  let component: EmployeeDisplay;
  let fixture: ComponentFixture<EmployeeDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
