import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GreenHeaderComponent } from './green-header.component';

describe('GreenHeaderComponent', () => {
  let component: GreenHeaderComponent;
  let fixture: ComponentFixture<GreenHeaderComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GreenHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
