import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationPage } from './navigation-page';

describe('NavigationPage', () => {
  let component: NavigationPage;
  let fixture: ComponentFixture<NavigationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigationPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
