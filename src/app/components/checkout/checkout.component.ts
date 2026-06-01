import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cardOutline,
  cartOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  locationOutline,
  lockClosedOutline,
  receiptOutline
} from 'ionicons/icons';
import { forkJoin, of, switchMap } from 'rxjs';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

type CheckoutStep = 'shipping' | 'payment' | 'review';

interface CheckoutAddress {
  id: string | number;
  name: string;
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

interface CheckoutCard {
  id: string | number;
  brand?: string;
  last4?: string;
  maskedNumber?: string;
  expDisplay?: string;
  isDefault?: boolean;
  paymentCode?: string;
}

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonIcon,
    IonButton,
    BreadcrumbsComponent,
    FooterComponent
  ]
})
export class CheckoutComponent implements OnInit {
  cart: any = null;
  items: any[] = [];
  addresses: CheckoutAddress[] = [];
  cards: CheckoutCard[] = [];
  selectedAddressId: string | number | null = null;
  selectedCardId: string | number | null = null;
  activeStep: CheckoutStep = 'shipping';
  invoice: any = null;
  orderComments = '';
  notifyBySms = false;
  mobileNumber = '';
  isPlacingOrder = false;

  readonly steps: Array<{ key: CheckoutStep; label: string; icon: string }> = [
    { key: 'shipping', label: 'Shipping', icon: 'location-outline' },
    { key: 'payment', label: 'Payment', icon: 'card-outline' },
    { key: 'review', label: 'Review', icon: 'receipt-outline' }
  ];

  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router
  ) {
    addIcons({
      cardOutline,
      cartOutline,
      checkmarkCircleOutline,
      chevronBackOutline,
      chevronForwardOutline,
      locationOutline,
      lockClosedOutline,
      receiptOutline
    });
  }

  ngOnInit(): void {
    this.loadCheckoutData();
  }

  private loadCheckoutData(): void {
    this.utilService.showLoader();
    forkJoin({
      cartRes: this.apiService.getCartItems(),
      profileRes: this.apiService.getCustomerProfile(),
      cardsRes: this.apiService.getCustomerCreditCards()
    }).subscribe({
      next: ({ cartRes, profileRes, cardsRes }: any) => {
        const cart = cartRes?.data ?? cartRes;
        const profile = profileRes?.data ?? profileRes;
        const cardsPayload = cardsRes?.data ?? cardsRes;

        this.cart = cart;
        this.items = cart?.products ?? [];
        this.utilService.setCart(cart);
        if (profile) this.utilService.setUserProfile(profile);

        this.addresses = this.normalizeAddresses(profile);
        this.cards = this.normalizeCards(cardsPayload);
        this.selectedAddressId = this.addresses.find((a) => a.isDefault)?.id ?? this.addresses[0]?.id ?? null;
        this.selectedCardId = this.cards.find((c) => c.isDefault)?.id ?? this.cards[0]?.id ?? null;
        this.mobileNumber = profile?.phoneNumber ?? profile?.phone ?? '';
        this.loadInvoice();
        this.utilService.hideLoader();
      },
      error: (err: any) => {
        this.utilService.hideLoader();
        this.utilService.showToast(this.utilService.parseErrorMessage(err) || 'Unable to load checkout.', 'danger');
      }
    });
  }

  private normalizeAddresses(profile: any): CheckoutAddress[] {
    const list = Array.isArray(profile?.addresses) ? profile.addresses : [];
    if (list.length) {
      return list.map((a: any, idx: number) => this.toAddress(a, idx, profile));
    }

    const fallback = this.toAddress(profile, 0, profile);
    const hasAddress = !!fallback.addressFirstLine || !!fallback.city || !!fallback.state || !!fallback.postalCode;
    return hasAddress ? [fallback] : [];
  }

  private toAddress(a: any, idx: number, profile: any): CheckoutAddress {
    const firstName = a?.firstName ?? a?.firstname ?? profile?.firstName ?? '';
    const lastName = a?.lastName ?? a?.lastname ?? profile?.lastName ?? '';

    return {
      id: a?.id ?? a?.addressId ?? a?.addressID ?? a?.address_id ?? idx,
      name: `${firstName} ${lastName}`.trim() || profile?.email || 'Shipping Address',
      company: a?.company ?? a?.Company,
      addressFirstLine: a?.addressFirstLine ?? a?.address1 ?? a?.Address1 ?? a?.street,
      addressSecondLine: a?.addressSecondLine ?? a?.address2 ?? a?.Address2 ?? a?.suburb,
      city: a?.city ?? a?.City,
      state: a?.state ?? a?.stateCode ?? a?.State ?? a?.StateCode,
      postalCode: a?.postalCode ?? a?.zip ?? a?.Zip,
      country: a?.country ?? a?.countryCode ?? a?.Country ?? a?.CountryCode,
      phoneNumber: a?.phoneNumber ?? a?.phone ?? a?.PhoneNumber ?? profile?.phoneNumber,
      isDefault: !!(a?.isDefault ?? a?.default ?? a?.is_default)
    };
  }

  private normalizeCards(payload: any): CheckoutCard[] {
    const list =
      payload?.customerSavedCards ??
      payload?.savedCards ??
      payload?.cards ??
      (Array.isArray(payload) ? payload : []);

    return Array.isArray(list)
      ? list.map((c: any, idx: number) => {
        const maskedNumber = c?.cardMaskedNumber ?? c?.maskedNumber ?? c?.card_masked_number ?? c?.masked;
        const digits = String(maskedNumber ?? '').replace(/\D+/g, '');
        const last4 = c?.last4 ?? c?.cardLast4 ?? (digits.length >= 4 ? digits.slice(-4) : undefined);
        const expMonth = String(c?.expMonth ?? c?.exp_month ?? c?.cardExpMonth ?? '').padStart(2, '0');
        const expYear = String(c?.expYear ?? c?.exp_year ?? c?.cardExpYear ?? '');
        const expDisplay = c?.expirationDate ?? c?.expiryDate ?? (expMonth.trim() && expYear.trim() ? `${expMonth}/${expYear.slice(-2)}` : undefined);

        return {
          id: c?.savedCardID ?? c?.savedCardId ?? c?.id ?? idx,
          brand: c?.cardInfo ?? c?.brand ?? c?.cardBrand ?? c?.cardType,
          maskedNumber,
          last4,
          expDisplay,
          isDefault: !!(c?.isDefault ?? c?.default ?? c?.is_default ?? c?.defaultCard),
          paymentCode: c?.paymentCode ?? c?.payment_method ?? c?.methodCode
        };
      })
      : [];
  }

  private loadInvoice(): void {
    this.apiService.getCartInvoice(this.buildInvoicePayload()).subscribe({
      next: (res: any) => {
        const payload = res?.data ?? res;
        this.invoice = payload?.orderDetails ?? payload?.invoice?.orderDetails ?? payload;
      },
      error: () => {
        this.invoice = null;
      }
    });
  }

  private buildInvoicePayload(): any {
    const shippingMethod = this.cart?.shippingMethod ?? this.cart?.selectedShippingMethod ?? {};
    return {
      shippingMethod: {
        courierCode: shippingMethod?.courierCode ?? shippingMethod?.code ?? '',
        methodName: shippingMethod?.methodName ?? shippingMethod?.name ?? '',
        applyStoreCredit: shippingMethod?.applyStoreCredit ?? '',
        couponCode: this.cart?.couponCode ?? ''
      }
    };
  }

  get selectedAddress(): CheckoutAddress | undefined {
    return this.addresses.find((a) => a.id === this.selectedAddressId);
  }

  get selectedCard(): CheckoutCard | undefined {
    return this.cards.find((c) => c.id === this.selectedCardId);
  }

  get stepIndex(): number {
    return this.steps.findIndex((step) => step.key === this.activeStep);
  }

  setStep(step: CheckoutStep): void {
    if (this.canOpenStep(step)) this.activeStep = step;
  }

  canOpenStep(step: CheckoutStep): boolean {
    if (step === 'shipping') return true;
    if (step === 'payment') return !!this.selectedAddressId;
    return !!this.selectedAddressId && !!this.selectedCardId;
  }

  nextStep(): void {
    if (this.activeStep === 'shipping') {
      if (!this.selectedAddressId) {
        this.utilService.showToast('Please select a shipping address.', 'warning');
        return;
      }
      this.activeStep = 'payment';
      return;
    }

    if (this.activeStep === 'payment') {
      if (!this.selectedCardId) {
        this.utilService.showToast('Please select a payment method.', 'warning');
        return;
      }
      this.activeStep = 'review';
    }
  }

  previousStep(): void {
    if (this.activeStep === 'review') {
      this.activeStep = 'payment';
      return;
    }
    if (this.activeStep === 'payment') this.activeStep = 'shipping';
  }

  addAddress(): void {
    this.router.navigate(['/shipping-address']);
  }

  addCard(): void {
    this.router.navigate(['/add-credit-card']);
  }

  placeOrder(): void {
    if (!this.selectedCardId) {
      this.utilService.showToast('Please select a payment method.', 'warning');
      return;
    }

    const payload: any = {
      orderComments: this.orderComments.trim(),
      paymentMethod: this.selectedCard?.paymentCode || 'savedcard',
      cardInfo: {
        savedCardID: this.selectedCardId
      }
    };

    this.isPlacingOrder = true;
    this.utilService.showLoader();
    this.apiService.checkoutCart(payload).pipe(
      switchMap((res: any) => {
        const body = res?.data ?? res;
        const result = (body?.result || body?.Result || '').toString().toLowerCase();
        if (result && result !== 'ok') {
          throw new Error(body?.errors?.message || body?.message || 'Unable to place order.');
        }

        const checkoutResult = body?.data?.checkoutResult ?? body?.checkoutResult;
        const redirectUrl = checkoutResult?.reDirectUrl ?? checkoutResult?.redirectUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return of(checkoutResult);
        }

        const orderID = checkoutResult?.orderID ?? checkoutResult?.orderId;
        const paymentSettled = checkoutResult?.paymentSettled ?? checkoutResult?.isPaymentSettled;
        if (!paymentSettled || !orderID) return of(checkoutResult);

        if (!this.notifyBySms) return of(checkoutResult);

        return this.apiService.sendOrderTrackingSms({
          phoneNumber: this.mobileNumber,
          orderID,
          notify: this.notifyBySms
        }).pipe(switchMap(() => of(checkoutResult)));
      })
    ).subscribe({
      next: (checkoutResult: any) => {
        const orderID = checkoutResult?.orderID ?? checkoutResult?.orderId;
        this.isPlacingOrder = false;
        this.utilService.hideLoader();
        this.utilService.showToast('Order placed successfully.', 'success');
        if (orderID) {
          this.router.navigate(['/order-history', orderID]);
        } else {
          this.router.navigate(['/order-history']);
        }
      },
      error: (err: any) => {
        this.isPlacingOrder = false;
        this.utilService.hideLoader();
        this.utilService.showToast(err?.message || this.utilService.parseErrorMessage(err) || 'Unable to place order.', 'danger');
      }
    });
  }

  getImageBaseUrl(): string {
    return this.utilService.getImgBaseUrl();
  }

  trackById = (_: number, item: { id: string | number }) => item.id;
  trackByItemId = (_: number, item: any) => item.itemID ?? _;
}
