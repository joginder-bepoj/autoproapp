import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, saveOutline } from 'ionicons/icons';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-add-credit-card-modal',
  templateUrl: './add-credit-card-modal.component.html',
  styleUrls: ['./add-credit-card-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon],
})
export class AddCreditCardModalComponent {
  @Input() addresses: any[] = [];
  @Input() selectedAddressId: any = null;
  @Output() saved = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  cardNumber = '';
  expiryDate = '';
  cvv = '';
  isSaving = false;

  constructor(
    private apiService: ApiService,
    private utilService: UtilService
  ) {
    addIcons({ closeOutline, saveOutline });
  }

  get billingAddressId(): any {
    return this.selectedAddressId ?? this.addresses?.[0]?.addressID ?? this.addresses?.[0]?.addressId ?? this.addresses?.[0]?.id ?? null;
  }

  selectBillingAddress(address: any) {
    this.selectedAddressId = address?.addressID ?? address?.addressId ?? address?.id ?? null;
  }

  isSelectedAddress(address: any): boolean {
    return this.selectedAddressId === (address?.addressID ?? address?.addressId ?? address?.id);
  }

  formatCardNumber(event: any) {
    const raw = (event?.target?.value || '') as string;
    this.cardNumber = raw.replace(/\D+/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  submit() {
    const number = this.normalizeCardNumber(this.cardNumber);
    if (number.length < 12 || number.length > 19) {
      this.utilService.showToast('Please enter a valid card number', 'warning');
      return;
    }

    const cleanExpiry = (this.expiryDate || '').replace(/\s+/g, '');
    const [expMonth = '', expYear = ''] = cleanExpiry.split('/');

    if (!this.isValidMonth(expMonth)) {
      this.utilService.showToast('Please enter a valid expiry date (MM / YYYY)', 'warning');
      return;
    }

    if (!this.isValidYear(expYear)) {
      this.utilService.showToast('Please enter a valid expiry date (MM / YYYY)', 'warning');
      return;
    }

    const cleanCvv = (this.cvv || '').replace(/\D+/g, '');
    if (cleanCvv.length < 3) {
      this.utilService.showToast('Please enter a valid CVV', 'warning');
      return;
    }

    const payload = {
      billToID: this.billingAddressId ?? 0,
      cardInfo: {
        nickName: '',
        cardNumber: number,
        cvv: cleanCvv,
        cardExpMonth: parseInt(expMonth, 10),
        cardExpYear: parseInt(expYear, 10) % 100,
      },
    };

    this.isSaving = true;
    this.utilService.showLoader();
    this.apiService.addCustomerCreditCard(payload).subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        this.isSaving = false;

        if (res?.result === 'ERROR') {
          const errorMsg = res?.errors?.message || res?.message || 'An error occurred while adding the credit card';
          this.utilService.showToast(errorMsg, 'danger');
          return;
        }

        this.utilService.showToast('Credit card added successfully', 'success');
        this.resetForm();
        this.saved.emit(res?.data ?? res);
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        this.isSaving = false;
        this.utilService.showToast(this.utilService.parseErrorMessage(err), 'danger');
      },
    });
  }

  onCancel() {
    this.cancel.emit();
  }

  private resetForm() {
    this.cardNumber = '';
    this.expiryDate = '';
    this.cvv = '';
  }

  private normalizeCardNumber(value: string): string {
    return (value || '').replace(/\D+/g, '');
  }

  private isValidMonth(value: string): boolean {
    const month = Number(value);
    return Number.isInteger(month) && month >= 1 && month <= 12;
  }

  private isValidYear(value: string): boolean {
    const year = Number(value);
    return Number.isInteger(year) && year >= 2020 && year <= 2100;
  }
}
