import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline, closeOutline, saveOutline } from 'ionicons/icons';
import { UtilService } from 'src/app/services/util.service';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

@Component({
  selector: 'app-add-credit-card',
  templateUrl: './add-credit-card.component.html',
  styleUrls: ['./add-credit-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon, IonLabel, FooterComponent],
})
export class AddCreditCardComponent {
  nameOnCard = '';
  cardNumber = '';
  expMonth = '';
  expYear = '';
  cvv = '';
  billingZip = '';

  constructor(
    private router: Router,
    private utilService: UtilService
  ) {
    addIcons({ cardOutline, closeOutline, saveOutline });
  }

  cancel() {
    this.router.navigate(['/credit-cards']);
  }

  private normalizeCardNumber(value: string): string {
    return (value || '').replace(/\D+/g, '');
  }

  private isValidMonth(value: string): boolean {
    const m = Number(value);
    return Number.isInteger(m) && m >= 1 && m <= 12;
  }

  private isValidYear(value: string): boolean {
    const y = Number(value);
    if (!Number.isInteger(y)) return false;
    return y >= 2020 && y <= 2100;
  }

  save() {
    const number = this.normalizeCardNumber(this.cardNumber);
    if (!this.nameOnCard.trim()) {
      this.utilService.showToast('Please enter name on card', 'warning');
      return;
    }
    if (number.length < 12 || number.length > 19) {
      this.utilService.showToast('Please enter a valid card number', 'warning');
      return;
    }
    if (!this.isValidMonth(this.expMonth)) {
      this.utilService.showToast('Please enter a valid expiry month (1-12)', 'warning');
      return;
    }
    if (!this.isValidYear(this.expYear)) {
      this.utilService.showToast('Please enter a valid expiry year', 'warning');
      return;
    }
    if ((this.cvv || '').replace(/\D+/g, '').length < 3) {
      this.utilService.showToast('Please enter a valid CVV', 'warning');
      return;
    }

    // Backend save endpoint is not wired in this app yet.
    this.utilService.showToast('Card saved (UI only)', 'success');
    this.router.navigate(['/credit-cards']);
  }
}

