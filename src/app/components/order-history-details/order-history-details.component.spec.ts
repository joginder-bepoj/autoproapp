import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OrderHistoryDetailsComponent } from './order-history-details.component';

describe('OrderHistoryDetailsComponent', () => {
  let component: OrderHistoryDetailsComponent;
  let fixture: ComponentFixture<OrderHistoryDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), OrderHistoryDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderHistoryDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
