import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderTrackerPage } from './order-tracker.page';

describe('OrderTrackerPage', () => {
  let component: OrderTrackerPage;
  let fixture: ComponentFixture<OrderTrackerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderTrackerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
