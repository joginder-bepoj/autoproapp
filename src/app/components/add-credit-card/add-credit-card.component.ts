import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline, closeOutline, saveOutline, chevronForwardOutline } from 'ionicons/icons';
import { UtilService } from 'src/app/services/util.service';
import { ApiService } from 'src/app/services/api-service';
import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';

interface BillingAddress {
  id?: string | number;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressFirstLine?: string;
  addressSecondLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phoneNumber?: string;
  isDefault?: boolean;
}

@Component({
  selector: 'app-add-credit-card',
  templateUrl: './add-credit-card.component.html',
  styleUrls: ['./add-credit-card.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonInput, IonButton, IonIcon, IonLabel, FooterComponent, BreadcrumbsComponent],
})
export class AddCreditCardComponent implements OnInit {
  nameOnCard = '';
  cardNumber = '';
  expiryDate = '';
  expMonth = '';
  expYear = '';
  cvv = '';
  billingZip = '';

  addresses: BillingAddress[] = [];
  selectedAddressId: string | number | null = null;
  private user: any = null;

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService
  ) {
    addIcons({ cardOutline, closeOutline, saveOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.user = this.utilService.getUserProfile();
    if (this.user) {
      this.hydrateAddressesFromProfile(this.user);
      return;
    }

    this.utilService.showLoader();
    this.apiService.getCustomerProfile().subscribe({
      next: (res: any) => {
        const profile = res?.data ?? res;
        if (profile) {
          this.utilService.setUserProfile(profile);
          this.user = profile;
          this.hydrateAddressesFromProfile(profile);
        }
        this.utilService.hideLoader();
      },
      error: () => {
        this.utilService.hideLoader();
      }
    });
  }

  private hydrateAddressesFromProfile(profile: any) {
    const list = profile?.addresses;
    if (Array.isArray(list) && list.length > 0) {
      this.addresses = list.map((a: any, idx: number) => ({
        id: a?.id ?? a?.addressId ?? a?.addressID ?? a?.address_id ?? idx,
        firstName: a?.firstName ?? a?.firstname ?? a?.FirstName,
        lastName: a?.lastName ?? a?.lastname ?? a?.LastName,
        company: a?.company ?? a?.Company,
        addressFirstLine:
          a?.addressFirstLine ?? a?.address1 ?? a?.Address1 ?? a?.street ?? a?.Street,
        addressSecondLine:
          a?.addressSecondLine ?? a?.address2 ?? a?.Address2 ?? a?.suburb ?? a?.Suburb,
        city: a?.city ?? a?.City,
        state: a?.state ?? a?.stateCode ?? a?.State ?? a?.StateCode,
        postalCode: a?.postalCode ?? a?.zip ?? a?.Zip,
        country: a?.country ?? a?.countryCode ?? a?.Country ?? a?.CountryCode,
        phoneNumber: a?.phoneNumber ?? a?.phone ?? a?.PhoneNumber,
        isDefault: !!(a?.isDefault ?? a?.default ?? a?.is_default)
      }));
      this.selectedAddressId =
        this.addresses.find((x) => x.isDefault)?.id ?? this.addresses[0]?.id ?? null;
      return;
    }

    // Fallback to single-address fields from profile
    const fallback: BillingAddress = {
      id: 0,
      company: profile?.company || '',
      firstName: profile?.firstName || profile?.firstname || '',
      lastName: profile?.lastName || profile?.lastname || '',
      addressFirstLine: profile?.addressFirstLine || '',
      addressSecondLine: profile?.addressSecondLine || '',
      city: profile?.city || '',
      state: profile?.state || '',
      postalCode: profile?.postalCode || '',
      country: profile?.country || 'usa',
      phoneNumber: profile?.phoneNumber || profile?.phone || '',
      isDefault: true
    };

    const hasAny =
      !!fallback.company ||
      !!fallback.addressFirstLine ||
      !!fallback.city ||
      !!fallback.state ||
      !!fallback.postalCode;

    this.addresses = hasAny ? [fallback] : [];
    this.selectedAddressId = this.addresses[0]?.id ?? null;
  }

  selectAddress(addr: BillingAddress) {
    this.selectedAddressId = addr.id ?? null;
  }

  addNewAddress() {
    this.router.navigate(['/shipping-address']);
  }

  cancel() {
    this.router.navigate(['/credit-cards']);
  }

  private normalizeCardNumber(value: string): string {
    return (value || '').replace(/\D+/g, '');
  }

  formatCardNumber(event: any) {
    const input = event.target as HTMLIonInputElement;
    const raw = (input.value || '') as string;
    // Remove all non-digits
    const digits = raw.replace(/\D+/g, '');
    // Insert space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    // Update the model with formatted value
    this.cardNumber = formatted;
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
    if (number.length < 12 || number.length > 19) {
      this.utilService.showToast('Please enter a valid card number', 'warning');
      return;
    }

    // Parse combined expiry date (MM / YYYY or MM/YYYY)
    const cleanExpiry = (this.expiryDate || '').replace(/\s+/g, '');
    const parts = cleanExpiry.split('/');
    this.expMonth = parts[0] || '';
    this.expYear = parts[1] || '';

    if (!this.isValidMonth(this.expMonth)) {
      this.utilService.showToast('Please enter a valid expiry date (MM / YYYY)', 'warning');
      return;
    }
    if (!this.isValidYear(this.expYear)) {
      this.utilService.showToast('Please enter a valid expiry date (MM / YYYY)', 'warning');
      return;
    }
    if ((this.cvv || '').replace(/\D+/g, '').length < 3) {
      this.utilService.showToast('Please enter a valid CVV', 'warning');
      return;
    }

    const selectedAddr = this.addresses.find((a) => a.id === this.selectedAddressId) || this.addresses[0];

    // Parse expiry month as number, year as 2-digit
    const expMonthNum = parseInt(this.expMonth, 10);
    const expYearFull = parseInt(this.expYear, 10);
    const expYearShort = expYearFull % 100;

    const payload: any = {
      billToID: selectedAddr?.id ?? 0,
      cardInfo: {
        nickName: '',
        cardNumber: number,
        cvv: (this.cvv || '').replace(/\D+/g, ''),
        cardExpMonth: expMonthNum,
        cardExpYear: expYearShort
      }
    };

    this.utilService.showLoader();
    this.apiService.addCustomerCreditCard(payload).subscribe({
      next: (res: any) => {
        this.utilService.hideLoader();
        // Check for API-level error even on HTTP 200
        if (res?.result === 'ERROR') {
          const errorMsg = res?.errors?.message || res?.message || 'An error occurred while adding the credit card';
          this.utilService.showToast(errorMsg, 'danger');
          return;
        }
        this.utilService.showToast('Credit card added successfully', 'success');
        this.router.navigate(['/credit-cards']);
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        const errorMsg = this.utilService.parseErrorMessage(err);
        this.utilService.showToast(errorMsg, 'danger');
      }
    });
  }
}

