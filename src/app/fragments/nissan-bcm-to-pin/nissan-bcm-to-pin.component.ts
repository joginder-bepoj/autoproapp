import { Component, OnInit, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchOutline, keyOutline, flashOutline, arrowForwardOutline, cubeOutline, syncOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nissan-bcm-to-pin',
  templateUrl: './nissan-bcm-to-pin.component.html',
  styleUrls: ['./nissan-bcm-to-pin.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class NissanBcmToPinComponent implements OnInit, OnDestroy {

  // @ViewChildren('digitInput') inputs?: QueryList<ElementRef>;

  inputs = [1, 2, 3, 4, 5]
  bcmDigits: string[] = ['', '', '', '', ''];
  user: any;
  private userSub?: Subscription;

  showResult: boolean = false;
  pinResult: any = null;

  constructor(private apiService: ApiService, private utilService: UtilService) {
    addIcons({ searchOutline, keyOutline, flashOutline, arrowForwardOutline, cubeOutline, syncOutline });
  }

  ngOnInit() {
    this.userSub = this.utilService.currentUser$.subscribe((user: any) => {
      this.user = user;
    });
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

  // onKeyUp(event: any, index: number) {
  //   if (event.key === 'Backspace') {
  //     const target = event.target as HTMLInputElement;
  //     if (!target.value && index > 0) {
  //       this.getFocusedElement(index - 1)?.focus();
  //     }
  //   }
  // }


  isInputValid(): boolean {
    const bcm = this.bcmDigits.join('');
    return bcm.length === 5 && /^[a-zA-Z0-9]{5}$/.test(bcm);
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

  async searchPin() {
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
          this.utilService.showAlert('Limit Reached', 'Sorry, you reached daily limit (20)');
        } else if (triesInHour >= 5) {
          this.utilService.hideLoader();
          this.utilService.showAlert('Limit Reached', 'Sorry, you reached hourly limit (5)');
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
    this.utilService.showToast('20-digit conversion coming soon!', 'primary');
  }

}
