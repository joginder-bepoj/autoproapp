import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NissanBcmToPinComponent } from './nissan-bcm-to-pin.component';

describe('NissanBcmToPinComponent', () => {
  let component: NissanBcmToPinComponent;
  let fixture: ComponentFixture<NissanBcmToPinComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NissanBcmToPinComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NissanBcmToPinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
