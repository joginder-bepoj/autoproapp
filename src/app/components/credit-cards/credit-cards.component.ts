import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline, closeOutline, chevronForwardOutline } from 'ionicons/icons';
import { UtilService } from 'src/app/services/util.service';
import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { ApiService } from 'src/app/services/api-service';
import { forkJoin } from 'rxjs';

interface SavedCard {
  id: string | number;
  brand?: string;
  maskedNumber?: string;
  last4?: string;
  expMonth?: string;
  expYear?: string;
  expDisplay?: string;
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  addressFirstLine?: string;
  addressSecondLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phoneNumber?: string;
}

@Component({
  selector: 'app-credit-cards',
  templateUrl: './credit-cards.component.html',
  styleUrls: ['./credit-cards.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FooterComponent],
})
export class CreditCardsComponent implements OnInit {
  cards: SavedCard[] = [];

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService
  ) {
    addIcons({ cardOutline, closeOutline, chevronForwardOutline });
  }

  ngOnInit(): void {
    this.fetchCards();
  }

  private fetchCards() {
    this.utilService.showLoader();
    forkJoin({
      cardsRes: this.apiService.getCustomerCreditCards(),
      profileRes: this.apiService.getCustomerProfile(),
    }).subscribe({
      next: ({ cardsRes, profileRes }: any) => {
        const cardsPayload = cardsRes?.data ?? cardsRes;
        const profile = profileRes?.data ?? profileRes;

        const list =
          cardsPayload?.customerSavedCards ??
          cardsPayload?.savedCards ??
          cardsPayload?.cards ??
          (Array.isArray(cardsPayload) ? cardsPayload : null);

        this.hydrateCardsFromList(list, profile);
        this.utilService.hideLoader();
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        const message = this.utilService.parseErrorMessage(err);
        this.utilService.showToast(message, 'danger');
        this.cards = [];
      },
    });
  }

  private hydrateCardsFromList(list: any, profile?: any) {
    if (!Array.isArray(list) || list.length === 0) {
      this.cards = [];
      return;
    }

    const profileName = {
      firstName: profile?.firstName ?? profile?.firstname ?? profile?.FirstName,
      lastName: profile?.lastName ?? profile?.lastname ?? profile?.LastName,
      phoneNumber: profile?.phoneNumber ?? profile?.phone ?? profile?.PhoneNumber,
    };

    const addr = this.pickProfileAddress(profile);

    this.cards = list.map((c: any, idx: number) => {
      const maskedNumber: string | undefined =
        c?.cardMaskedNumber ?? c?.maskedNumber ?? c?.card_masked_number ?? c?.masked ?? undefined;

      const last4 =
        (c?.last4 ?? c?.Last4 ?? c?.cardLast4 ?? c?.card_last4 ?? undefined) ||
        (maskedNumber ? this.extractLast4(maskedNumber) : undefined);

      const expMonth =
        c?.expMonth ?? c?.exp_month ?? c?.expiryMonth ?? c?.ExpMonth ?? c?.cardExpMonth;
      const expYear =
        c?.expYear ?? c?.exp_year ?? c?.expiryYear ?? c?.ExpYear ?? c?.cardExpYear;

      const expDisplayRaw: string | undefined =
        c?.expirationDate ?? c?.expiryDate ?? c?.cardExpirationDate ?? c?.cardExp ?? undefined;

      const expDisplay = this.formatExpiration(expMonth, expYear, expDisplayRaw);

      return {
        id: c?.savedCardID ?? c?.savedCardId ?? c?.id ?? idx,
        brand: c?.cardInfo ?? c?.brand ?? c?.cardBrand ?? c?.cardType ?? undefined,
        maskedNumber,
        last4,
        expMonth,
        expYear,
        expDisplay,
        isDefault: !!(c?.isDefault ?? c?.default ?? c?.is_default ?? c?.defaultCard),
        firstName: c?.firstName ?? c?.firstname ?? c?.FirstName ?? profileName.firstName,
        lastName: c?.lastName ?? c?.lastname ?? c?.LastName ?? profileName.lastName,
        addressFirstLine:
          c?.addressFirstLine ?? c?.address1 ?? c?.Address1 ?? c?.street ?? c?.Street ?? addr.addressFirstLine,
        addressSecondLine:
          c?.addressSecondLine ?? c?.address2 ?? c?.Address2 ?? c?.suburb ?? c?.Suburb ?? addr.addressSecondLine,
        city: c?.city ?? c?.City ?? addr.city,
        state: c?.state ?? c?.stateCode ?? c?.State ?? c?.StateCode ?? addr.state,
        postalCode: c?.postalCode ?? c?.zip ?? c?.Zip ?? addr.postalCode,
        phoneNumber: c?.phoneNumber ?? c?.phone ?? c?.PhoneNumber ?? profileName.phoneNumber,
      };
    });
  }

  private extractLast4(masked: string): string | undefined {
    const digits = (masked || '').replace(/\D+/g, '');
    return digits.length >= 4 ? digits.slice(-4) : undefined;
  }

  private formatExpiration(expMonth: any, expYear: any, expRaw?: string): string | undefined {
    const raw = (expRaw || '').trim();
    if (raw) return raw;

    const m = String(expMonth ?? '').trim();
    const y = String(expYear ?? '').trim();
    if (!m || !y) return undefined;

    const mm = m.padStart(2, '0');
    const yy = y.length === 4 ? y.slice(-2) : y;
    return `${mm}/${yy}`;
  }

  getFullName(c: SavedCard): string {
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
  }

  private pickProfileAddress(profile: any): {
    addressFirstLine?: string;
    addressSecondLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } {
    const list = profile?.addresses;
    const fromList = Array.isArray(list) && list.length
      ? (list.find((a: any) => !!(a?.isDefault ?? a?.default ?? a?.is_default)) ?? list[0])
      : null;

    if (fromList) {
      return {
        addressFirstLine:
          fromList?.addressFirstLine ?? fromList?.address1 ?? fromList?.Address1 ?? fromList?.street ?? fromList?.Street,
        addressSecondLine:
          fromList?.addressSecondLine ?? fromList?.address2 ?? fromList?.Address2 ?? fromList?.suburb ?? fromList?.Suburb,
        city: fromList?.city ?? fromList?.City,
        state: fromList?.state ?? fromList?.stateCode ?? fromList?.State ?? fromList?.StateCode,
        postalCode: fromList?.postalCode ?? fromList?.zip ?? fromList?.Zip,
      };
    }

    return {
      addressFirstLine: profile?.addressFirstLine,
      addressSecondLine: profile?.addressSecondLine,
      city: profile?.city,
      state: profile?.state,
      postalCode: profile?.postalCode,
    };
  }

  addNewCard() {
    this.router.navigate(['/add-credit-card']);
  }

  back() {
    this.router.navigate(['/account-settings']);
  }

  trackByCardId = (_: number, item: SavedCard) => item.id ?? _;

  makeDefault(_card: SavedCard) {
    this.utilService.showToast('Set default card coming soon', 'primary');
  }

  deleteCard(_card: SavedCard) {
    this.utilService.showToast('Delete card coming soon', 'primary');
  }
}
