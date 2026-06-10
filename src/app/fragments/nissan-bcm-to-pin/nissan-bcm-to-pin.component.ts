import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { keyOutline, flashOutline, arrowForwardOutline, cubeOutline, syncOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nissan-bcm-to-pin',
  templateUrl: './nissan-bcm-to-pin.component.html',
  styleUrls: ['./nissan-bcm-to-pin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, FooterComponent]
})
export class NissanBcmToPinComponent implements OnInit, OnDestroy {

  // @ViewChildren('digitInput') inputs?: QueryList<ElementRef>;

  inputs = [1, 2, 3, 4, 5]
  bcmDigits: string[] = ['', '', '', '', ''];
  user: any;
  bcm20Digit = false;
  bcm20DigitInput: string = '';
  private userSub?: Subscription;

  showResult: boolean = false;
  pinResult: any = null;

  constructor(private apiService: ApiService, private utilService: UtilService, private router: Router) {
    addIcons({ keyOutline, flashOutline, arrowForwardOutline, cubeOutline, syncOutline });
    this.bcm20Digit = this.router.url.includes('20-digit');
  }

  ngOnInit() {
    this.userSub = this.utilService.currentUser$.subscribe((user: any) => {
      this.user = user;
    });
    if (this.bcm20Digit) this.getCustomerPoints()
  }

  ngOnDestroy() {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  onInput(event: any, index: number) {

    let value = event.target.value;
    if (!value) {
      this.bcmDigits[index] = '';
      return;
    }

    this.bcmDigits[index] = value;
    const nextIndex = Math.min(index + 1, 4);
    this.getFocusedElement(nextIndex)?.focus();
  }

  private getFocusedElement(index: number): HTMLInputElement | undefined {
    return document.getElementById('bcmInput-' + index) as HTMLInputElement;
  }

  isInputValid(): boolean {
    const bcm = this.bcmDigits.join('');
    return bcm.length === 5 && /^[a-zA-Z0-9]{5}$/.test(bcm);
  }

  is20DigitInputValid(): boolean {
    const bcm = this.bcm20DigitInput;
    return bcm.length === 20 && /^[a-zA-Z0-9]{20}$/.test(bcm);
  }

  onKeyDown(event: any, index: number) {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;

      if (!input.value && index > 0) {
        const prev = this.getFocusedElement(index - 1);
        prev?.focus();
        prev!.value = '';
        this.bcmDigits[index - 1] = '';
      } else {
        this.bcmDigits[index] = '';
      }
    }
  }

  searchPin() {
    if (this.bcm20Digit) {
      this.search20DigitPin();
    } else {
      this.searchBcm5Pin();
    }
  }

  async searchBcm5Pin() {
    if (!this.isInputValid()) {
      this.utilService.showToast('Please enter a valid 5-digit BCM code', 'warning');
      return;
    }

    if (!this.user) {
      this.utilService.showToast('Please login to continue', 'danger');
      return;
    }

    const bcmCode = this.bcmDigits.join('').toUpperCase();
    this.utilService.showLoader();
    this.showResult = false;

    // 1. Check Limits First
    const userIdHex = this.utilService.strToHex(this.user?.customerID);
    this.apiService.checkNissan5BcmLimit(userIdHex).subscribe({
      next: (logs: any) => {
        let triesInDay = 0;
        let triesInHour = 0;
        const currentTimestamp = Date.now();

        if (logs) {
          const logValues = Object.values(logs);
          for (const timestamp of logValues) {
            const ts = Number(timestamp);
            if (currentTimestamp - ts <= 1000 * 60 * 60) triesInHour++;
            if (currentTimestamp - ts <= 1000 * 60 * 60 * 24) triesInDay++;
          }
        }

        if (triesInDay >= 20) {
          this.utilService.hideLoader();
          this.utilService.showToast('Sorry, you reached daily limit (20)', 'danger');
        } else if (triesInHour >= 5) {
          this.utilService.hideLoader();
          this.utilService.showToast('Sorry, you reached hourly limit (5)', 'danger');
        } else {
          this.performConversion(bcmCode, userIdHex);
        }
      },
      error: (err) => {
        this.utilService.hideLoader();
        this.utilService.showToast('Failed to verify character limits', 'danger');
        console.error(err);
      }
    });
  }

  private performConversion(bcmCode: string, userIdHex: string) {
    this.apiService.getNissan5BcmPin(bcmCode).subscribe({
      next: (res: any) => {
        if (res) {
          this.pinResult = res;
          this.showResult = true;
          this.apiService.logNissan5BcmConversion(userIdHex, Date.now()).subscribe();
          this.utilService.hideLoader();
        } else {
          this.utilService.hideLoader();
          this.utilService.showToast('Sorry, there is no result for that BCM', 'warning');
        }
      },
      error: (err) => {
        this.utilService.hideLoader();
        this.utilService.showToast('Conversion failed. Please try again.', 'danger');
        console.error(err);
      }
    });
  }

  goTo20Digit() {
    this.bcm20Digit = !this.bcm20Digit;
    this.showResult = false;
    this.bcmDigits = ['', '', '', '', ''];
    this.pinResult = null;
    if (this.bcm20Digit) {
      this.router.navigate(['/nissan-bcm-to-pin-20-digit']);
    } else {
      this.router.navigate(['/nissan-bcm-to-pin']);
    }

  }

  getCustomerPoints() {
    this.apiService.getCustomerPoints().subscribe({
      next: (res: any) => {
        if (res) {
          this.user.points = res.data.balance;
        }
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  search20DigitPin() {
    if (!this.is20DigitInputValid()) {
      this.utilService.showToast('Please enter a valid 20-digit BCM code', 'warning');
      return;
    }

    if (!this.user) {
      this.utilService.showToast('Please login to continue', 'danger');
      return;
    }

    const bcmCode = this.bcm20DigitInput.toUpperCase();
    this.utilService.showLoader();
    this.showResult = false;

    // 1. Check Limits First
    if (this.user.points < 2) {
      this.utilService.hideLoader();
      this.utilService.showToast('Sorry, you dont have enough points to convert', 'danger');
    } else {
      this.perform20DigitConversion(bcmCode);

    }
  }

  perform20DigitConversion(bcm: string) {
    if (!bcm) {
      this.utilService.hideLoader();
      this.utilService.showToast('Please enter the BCM', 'warning');
      return;
    }

    if (bcm.length !== 20) {
      this.utilService.hideLoader();
      this.utilService.showToast('Please correct BCM of length 20', 'warning');
      return;
    }

    const pin = this.utilService.convert(bcm);

    let formattedPin = '';

    for (let i = 0; i < pin.length; i++) {
      formattedPin += pin[i];
      if (i % 4 === 3) {
        formattedPin += ' ';
      }
    }

    formattedPin = formattedPin.trim();
    this.pinResult = formattedPin;
    this.showResult = true;
    this.utilService.hideLoader();

    this.apiService.updateCustomerPoints(-2.0, "Converted Nissan 20 digit to BCM")
      .subscribe({
        next: () => this.updatePoints(),
        error: () => { }
      });
  }

  updatePoints() {
    this.apiService.getCustomerPoints().subscribe({
      next: (res) => {
        this.user.points = parseInt(res.data.balance);
      },
      error: () => {
        this.utilService.showToast('Can not get your AutoProAPP Points', 'danger');
      },
    });
  }


}
