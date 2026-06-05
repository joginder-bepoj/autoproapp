import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin, Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api-service';
import { UtilService } from 'src/app/services/util.service';
import { AddCreditCardModalComponent } from '../add-credit-card-modal/add-credit-card-modal.component';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';
import { FooterComponent } from 'src/app/shared/footer/footer.component';

interface CheckoutCard {
  id: string | number;
  brand?: string;
  last4?: string;
  maskedNumber?: string;
  expDisplay?: string;
  isDefault?: boolean;
  paymentCode?: string;
}

interface CheckoutPaymentMethod {
  paymentCode?: string;
  paymentName?: string;
  paymentMethod?: string;
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
    AddCreditCardModalComponent,
    BreadcrumbsComponent,
    FooterComponent,
  ],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  constructor(
    private apiService: ApiService,
    private utilService: UtilService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  defaultShippingAddress: any = null;
  shippingQuotes: any = null;
  cartItems: any = null;
  user: any = null;
  savedCards: CheckoutCard[] = [];
  paymentMethods: CheckoutPaymentMethod[] = [];
  showChangeAddressModal = false;
  showAddCardModal = false;
  selectedAddressId: any = null;
  selectedShippingOption: any = null;
  selectedCardId: any = null;
  selectedPaymentMethod: any = null;
  storeCreditAvailable = 0;
  storeCreditAmount = '';
  appliedStoreCredit = 0;
  storeCreditError = '';
  currentStep = 1;
  placingOrder = false;
  orderComments = '';
  private paypalReturnSub?: Subscription;
  private paypalConfirming = false;

  ngOnInit(): void {
    this.user = this.utilService.getUserProfile();
    this.watchPaypalReturn();

    if (this.user) {
      this.initializeCheckoutFromUser();
      return;
    }

    this.fetchUserAndInitializeCheckout();
  }

  ngOnDestroy(): void {
    this.paypalReturnSub?.unsubscribe();
  }

  getCurrentUser() {
    return this.utilService.getUserProfile();
  }

  private initializeCheckoutFromUser(): void {
    this.selectedAddressId = this.user.defaultShippingAddressID ?? null;
    this.setAddress(this.selectedAddressId);
    this.getCheckoutData();
  }

  private fetchUserAndInitializeCheckout(): void {
    this.utilService.showLoader();

    this.apiService.getCustomerProfile().subscribe({
      next: (res: any) => {
        const profile = res?.data ?? res;

        if (profile) {
          this.user = profile;
          this.utilService.setUserProfile(profile);
          this.initializeCheckoutFromUser();
        } else {
          this.router.navigate(['/login'], {
            queryParams: { redirect: '/checkout' },
          });
        }

        this.utilService.hideLoader();
      },
      error: () => {
        this.utilService.hideLoader();
        this.router.navigate(['/login'], {
          queryParams: { redirect: '/checkout' },
        });
      },
    });
  }

  getCheckoutData() {
    this.utilService.showLoader();
    forkJoin({
      cartRes: this.apiService.getCartItems(),
      cardsRes: this.apiService.getCustomerCreditCards(),
    }).subscribe({
      next: ({ cartRes, cardsRes }: any) => {
        this.cartItems = cartRes?.data ?? cartRes ?? null;
        this.hydrateCards(cardsRes?.data ?? cardsRes);
        this.getShippingQuotes(this.selectedAddressId);
        this.getPaymentMethods();
        this.getStoreCredit();
        this.utilService.hideLoader();
      },
      error: () => {
        this.utilService.hideLoader();
        this.utilService.showToast('Failed to load checkout details', 'danger');
      },
    });
  }

  getShippingQuotes(addressId: string) {
    if (addressId) {
      this.apiService.getShippingQuotes(addressId).subscribe({
        next: (res: any) => {
          if (res.data) {
            this.shippingQuotes = res?.data;
            this.setDefaultShippingMethod();
          }
        },
        error: () => {
          this.utilService.showToast('Failed to fetch shipping quotes', 'danger');
        },
      });
    }
  }

  setAddress(id: any) {
    this.selectedAddressId = id;
    this.defaultShippingAddress =
      this.user?.addresses?.find((a: any) => {
        const addressId = a?.addressID ?? a?.addressId ?? a?.id;
        return addressId === id;
      }) ??
      this.user?.addresses?.[0] ??
      null;

    const addressId =
      this.defaultShippingAddress?.addressID ??
      this.defaultShippingAddress?.addressId ??
      this.defaultShippingAddress?.id;
    if (addressId && addressId !== this.selectedAddressId) {
      this.selectedAddressId = addressId;
    }
  }

  changeAddress(id: any) {
    this.setAddress(id);
    this.selectedShippingOption = null;
    this.shippingQuotes = null;
    this.getShippingQuotes(this.selectedAddressId);
    this.getPaymentMethods();
    this.onChangeAddressCancel();
  }

  openChangeAddressModal() {
    this.showChangeAddressModal = true;
  }

  onChangeAddressCancel() {
    this.showChangeAddressModal = false;
  }

  openAddCardModal() {
    this.showAddCardModal = true;
  }

  onAddCardCancel() {
    this.showAddCardModal = false;
  }

  onCardSaved() {
    this.showAddCardModal = false;
    this.refreshSavedCards(true);
  }

  getPaymentMethods() {
    if (!this.selectedAddressId) {
      this.paymentMethods = [];
      return;
    }

    this.apiService.getPaymentMethods(this.selectedAddressId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const modules =
          data?.paymentModules ??
          data?.payments ??
          data?.paymentMethods ??
          (Array.isArray(data) ? data : []);
        this.paymentMethods = Array.isArray(modules) ? modules : [];
      },
      error: () => {
        this.paymentMethods = [];
      },
    });
  }

  getStoreCredit() {
    this.apiService.getCustomerStoreCredit().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.storeCreditAvailable =
          Number(data?.storeCredit ?? data?.data?.storeCredit ?? 0) || 0;
      },
      error: () => {
        this.storeCreditAvailable = 0;
      },
    });
  }

  selectShipping(group: any, rate: any) {
    this.selectedShippingOption = {
      courierCode: group.courierCode,
      courierName: group.courierName,
      methodName: rate.methodName,
      price: rate.price,
    };
  }

  isSelected(group: any, rate: any): boolean {
    return (
      this.selectedShippingOption?.courierCode === group.courierCode &&
      this.selectedShippingOption?.methodName === rate.methodName
    );
  }

  setDefaultShippingMethod(): void {
    if (!this.shippingQuotes?.shippingRates?.length) {
      return;
    }

    const allRates: any[] = [];

    this.shippingQuotes.shippingRates.forEach((shippingItem: any) => {
      shippingItem?.rates?.forEach((rate: any) => {
        allRates.push({
          ...rate,
          courierCode: shippingItem.courierCode,
          courierName: shippingItem.courierName,
        });
      });
    });

    if (!allRates.length) {
      return;
    }

    const freeRates = allRates.filter((rate) => Number(rate.price) === 0);
    const freeUSPS = freeRates.find(
      (rate) =>
        rate.methodName?.toLowerCase().includes('usps') ||
        rate.methodName?.toLowerCase().includes('postal')
    );

    if (freeUSPS) {
      this.selectedShippingOption = freeUSPS;
      return;
    }

    let cheapestRate = allRates[0];

    allRates.forEach((rate) => {
      if (Number(rate.price) < Number(cheapestRate.price)) {
        cheapestRate = rate;
      }
    });

    this.selectedShippingOption = cheapestRate;
  }

  goToStep(step: number) {
    if (step === 2 && !this.selectedAddressId) {
      this.utilService.showToast('Please select a shipping address', 'warning');
      return;
    }

    if (step === 3 && !this.selectedShippingOption) {
      this.utilService.showToast('Please select a shipping method', 'warning');
      return;
    }

    this.currentStep = step;
  }

  selectCard(card: CheckoutCard) {
    this.selectedCardId = card.id;
    this.selectedPaymentMethod = {
      type: 'card',
      paymentMethod: 'braintree_api',
      paymentName: this.getCardLabel(card),
      cardInfo: { savedCardID: card.id },
    };
  }

  isCardSelected(card: CheckoutCard): boolean {
    return (
      this.selectedPaymentMethod?.type === 'card' &&
      this.selectedCardId === card.id
    );
  }

  selectPaymentMethod(method: CheckoutPaymentMethod) {
    this.selectedCardId = null;
    this.selectedPaymentMethod = {
      type: 'method',
      ...method,
    };
  }

  isPaymentMethodSelected(method: CheckoutPaymentMethod): boolean {
    return (
      this.selectedPaymentMethod?.type === 'method' &&
      this.selectedPaymentMethod?.paymentCode === method?.paymentCode
    );
  }

  getFilteredPaymentMethods(): CheckoutPaymentMethod[] {
    const excludedCodes = [
      'braintree_api',
      'storecredit',
      'store_credit',
      'leasing',
      'purchaseorder',
      'purchase_order',
      'checkmoneyorder',
      'check_money_order',
      'banktransfer',
      'bank_transfer',
    ];
    const excludedNames = [
      'check',
      'cash',
      'bank deposit',
      'leasing',
      'purchase order',
      'store credit',
    ];

    return this.paymentMethods.filter((method) => {
      const code = (
        method?.paymentCode ||
        method?.paymentMethod ||
        ''
      ).toLowerCase();
      const name = (method?.paymentName || '').toLowerCase();
      return (
        !excludedCodes.some((excluded) => code.includes(excluded)) &&
        !excludedNames.some((excluded) => name.includes(excluded))
      );
    });
  }

  applyStoreCredit() {
    const amount = Number(this.storeCreditAmount);
    this.storeCreditError = '';

    if (!amount || amount <= 0) {
      this.storeCreditError = 'Enter a valid store credit amount.';
      return;
    }

    if (amount > this.storeCreditAvailable) {
      this.storeCreditError = `Amount cannot exceed available store credit ($${this.storeCreditAvailable.toFixed(
        2
      )})`;
      return;
    }

    if (amount > this.getOrderTotalBeforeCredit()) {
      this.storeCreditError = `Amount cannot exceed order total ($${this.getOrderTotalBeforeCredit().toFixed(
        2
      )})`;
      return;
    }

    this.appliedStoreCredit = Math.min(amount, this.getMaxUsableStoreCredit());

    if (this.getOrderTotal() === 0) {
      this.selectedCardId = null;
      this.selectedPaymentMethod = {
        type: 'storecredit',
        paymentCode: 'storecredit',
        paymentName: `Store Credit: $${this.appliedStoreCredit.toFixed(2)}`,
      };
    }
  }

  removeStoreCredit() {
    this.appliedStoreCredit = 0;
    this.storeCreditAmount = '';
    this.storeCreditError = '';
    if (this.selectedPaymentMethod?.type === 'storecredit') {
      this.selectedPaymentMethod = null;
    }
  }

  canPlaceOrder(): boolean {
    return (
      !this.placingOrder &&
      (!!this.selectedPaymentMethod || this.getOrderTotal() === 0)
    );
  }

  getSelectedShippingCost(): number {
    return Number(
      this.selectedShippingOption?.price ??
        this.shippingQuotes?.shippingCost ??
        0
    );
  }

  getOrderTotalBeforeCredit(): number {
    return (
      Number(this.cartItems?.subTotal ?? 0) + this.getSelectedShippingCost()
    );
  }

  getMaxUsableStoreCredit(): number {
    return Math.min(
      this.storeCreditAvailable,
      this.getOrderTotalBeforeCredit()
    );
  }

  getOrderTotal(): number {
    return Math.max(
      0,
      this.getOrderTotalBeforeCredit() - this.appliedStoreCredit
    );
  }

  getCardLabel(card: CheckoutCard): string {
    const brand = card.brand || 'Card';
    const last4 = card.last4 || this.extractLast4(card.maskedNumber);
    return last4 ? `${brand} ****${last4}` : brand;
  }

  getPaymentLabel(): string {
    const paymentLabel = this.selectedPaymentMethod?.paymentName || '';
    if (
      this.appliedStoreCredit > 0 &&
      this.selectedPaymentMethod?.type !== 'storecredit'
    ) {
      return paymentLabel
        ? `${paymentLabel} + Store Credit ($${this.appliedStoreCredit.toFixed(
            2
          )})`
        : `Store Credit ($${this.appliedStoreCredit.toFixed(2)})`;
    }

    return paymentLabel;
  }

  trackByCardId = (_: number, item: CheckoutCard) => item.id ?? _;
  trackByPaymentCode = (_: number, item: CheckoutPaymentMethod) =>
    item.paymentCode ?? item.paymentMethod ?? _;

  private refreshSavedCards(selectLatest = false) {
    this.apiService.getCustomerCreditCards().subscribe({
      next: (res: any) => {
        const previousId = this.selectedCardId;
        this.hydrateCards(res?.data ?? res);

        if (selectLatest && this.savedCards.length) {
          const latest = this.savedCards[this.savedCards.length - 1];
          this.selectedCardId = latest.id;
          this.selectCard(latest);
          return;
        }

        if (
          previousId &&
          this.savedCards.some((card) => card.id === previousId)
        ) {
          this.selectedCardId = previousId;
        }
      },
      error: () => {
        this.utilService.showToast(
          'Card saved, but failed to refresh saved cards',
          'warning'
        );
      },
    });
  }

  private hydrateCards(cardsPayload: any) {
    const list =
      cardsPayload?.customerSavedCards ??
      cardsPayload?.savedCards ??
      cardsPayload?.cards ??
      (Array.isArray(cardsPayload) ? cardsPayload : []);

    if (!Array.isArray(list)) {
      this.savedCards = [];
      return;
    }

    this.savedCards = list.map((card: any, index: number) => {
      const maskedNumber =
        card?.cardMaskedNumber ??
        card?.maskedNumber ??
        card?.card_masked_number ??
        card?.masked;
      const last4 =
        card?.last4 ??
        card?.Last4 ??
        card?.cardLast4 ??
        card?.card_last4 ??
        this.extractLast4(maskedNumber);
      const expMonth =
        card?.expMonth ??
        card?.exp_month ??
        card?.expiryMonth ??
        card?.ExpMonth ??
        card?.cardExpMonth;
      const expYear =
        card?.expYear ??
        card?.exp_year ??
        card?.expiryYear ??
        card?.ExpYear ??
        card?.cardExpYear;

      return {
        id: card?.savedCardID ?? card?.savedCardId ?? card?.id ?? index,
        brand:
          card?.cardInfo ?? card?.brand ?? card?.cardBrand ?? card?.cardType,
        last4,
        maskedNumber,
        expDisplay: this.formatExpiration(
          expMonth,
          expYear,
          card?.expirationDate ?? card?.expiryDate ?? card?.cardExpirationDate
        ),
        isDefault: !!(
          card?.isDefault ??
          card?.default ??
          card?.is_default ??
          card?.defaultCard
        ),
        paymentCode: card?.paymentCode,
      };
    });

    const defaultCard =
      this.savedCards.find((card) => card.isDefault) ?? this.savedCards[0];
    this.selectedCardId = defaultCard?.id ?? null;
    if (defaultCard && !this.selectedPaymentMethod) {
      this.selectCard(defaultCard);
    }
  }

  private extractLast4(masked: string | undefined): string | undefined {
    const digits = (masked || '').replace(/\D+/g, '');
    return digits.length >= 4 ? digits.slice(-4) : undefined;
  }

  private formatExpiration(
    expMonth: any,
    expYear: any,
    expRaw?: string
  ): string | undefined {
    const raw = (expRaw || '').trim();
    if (raw) return raw;

    const month = String(expMonth ?? '').trim();
    const year = String(expYear ?? '').trim();
    if (!month || !year) return undefined;

    return `${month.padStart(2, '0')}/${
      year.length === 4 ? year.slice(-2) : year
    }`;
  }

  async handleCheckout(): Promise<void> {
    if (!this.selectedPaymentMethod && this.getOrderTotal() > 0) {
      this.utilService.showToast(
        'Please complete your payment selection.',
        'warning'
      );
      return;
    }

    if (!this.selectedShippingOption) {
      this.utilService.showToast(
        'Please complete your shipping selection.',
        'warning'
      );
      return;
    }

    const shippingAddressID =
      this.defaultShippingAddress?.addressID ??
      this.defaultShippingAddress?.addressId ??
      this.defaultShippingAddress?.id ??
      this.selectedAddressId;

    if (!shippingAddressID) {
      this.utilService.showToast(
        'Please select a shipping address.',
        'warning'
      );
      return;
    }

    // Use the same address as billing since the component
    // doesn't expose a separate billing address selector.
    const billingAddressID = shippingAddressID;

    this.placingOrder = true;
    this.utilService.showLoader();

    try {
      // STEP 1 - Verify Cart
      const cartResponse: any = await firstValueFrom(
        this.apiService.getCartItems()
      );

      const cartProducts =
        cartResponse?.data?.products ||
        cartResponse?.products ||
        [];

      if (cartProducts.length === 0) {
        this.utilService.showToast('Your cart is empty.', 'warning');
        this.placingOrder = false;
        this.utilService.hideLoader();
        return;
      }

      // STEP 2 - Shipping Quote
      await firstValueFrom(this.apiService.getShippingQuotes(shippingAddressID));

      // STEP 3 - Finalize Cart (shipping method + store credit)
      const postCartBody: any = {
        shippingMethod: {
          courierCode: this.selectedShippingOption.courierCode || '',
          methodName: this.selectedShippingOption.methodName || '',
        },
      };

      if (this.appliedStoreCredit > 0 && this.storeCreditAvailable > 0) {
        postCartBody.aplyStoreCredit = Number(
          this.appliedStoreCredit.toFixed(2)
        );
      }

      const couponCode = this.extractCouponCode(this.orderComments);
      if (couponCode) {
        postCartBody.couponCode = couponCode;
      }

      const postCartResult: any = await firstValueFrom(
        this.apiService.postCart(postCartBody)
      );

      const postCartData = postCartResult?.data ?? postCartResult;
      if (postCartData?.result === 'ERROR') {
        const errorCode = postCartData?.errors?.code;
        const errorMessage =
          postCartData?.errors?.message ||
          postCartData?.error_message ||
          'Failed to finalize cart';

        if (errorCode === '3028') {
          this.utilService.showToast(
            'Your cart has expired or been updated. Please review your cart and try again.',
            'warning'
          );
        } else {
          this.utilService.showToast(errorMessage, 'danger');
        }
        this.utilService.hideLoader();
        return;
      }

      // STEP 4 - Load Payment Methods
      await firstValueFrom(
        this.apiService.getPaymentMethods(billingAddressID)
      );

      const adjustedTotal = this.getOrderTotal();

      const baseBody: any = {
        origin: 'WEB',
        orderComments: this.orderComments || '',
      };

      // If the order is fully covered by store credit, bypass card payment
      if (adjustedTotal === 0) {
        const body = {
          ...baseBody,
          paymentMethod: 'storecredit',
        };

        const result: any = await firstValueFrom(
          this.apiService.checkoutCart(body)
        );
        const resultData = result?.data ?? result;

        if (resultData?.result === 'OK') {
          const checkoutResult = resultData?.checkoutResult;
          this.utilService.showToast(
            `Order placed successfully! Order ID: ${checkoutResult?.orderID || ''}`,
            'success'
          );
          this.router.navigate(['/']);
        } else {
          this.utilService.showToast(
            resultData?.error_message || 'Checkout failed',
            'danger'
          );
        }
        this.utilService.hideLoader();
        return;
      }

      let checkoutBody: any = {
        ...baseBody,
        paymentMethod:
          this.selectedPaymentMethod?.paymentMethod ||
          this.selectedPaymentMethod?.paymentCode,
      };

      // SAVED CARD
      if (
        checkoutBody.paymentMethod === 'braintree_api' &&
        this.selectedPaymentMethod?.cardInfo?.savedCardID
      ) {
        checkoutBody.cardInfo = {
          savedCardID: this.selectedPaymentMethod.cardInfo.savedCardID,
        };
      }
      // NEW CARD
      else if (
        checkoutBody.paymentMethod === 'braintree_api' &&
        this.selectedPaymentMethod?.cardInfo?.cardNumber
      ) {
        checkoutBody.cardInfo = {
          savedCard:
            this.selectedPaymentMethod.cardInfo.savedCard !== false,
          cardNumber: this.selectedPaymentMethod.cardInfo.cardNumber,
          cvv: this.selectedPaymentMethod.cardInfo.cvv,
          cardExpMonth: this.selectedPaymentMethod.cardInfo.cardExpMonth,
          cardExpYear: this.selectedPaymentMethod.cardInfo.cardExpYear,
        };
      }
      // SPLIT CARD
      else if (this.selectedPaymentMethod?.splitCardInfo) {
        checkoutBody.splitCardInfo = this.selectedPaymentMethod.splitCardInfo;
        checkoutBody.paymentMethod = 'braintree_api';
      }
      // PAYPAL
      else if (
        checkoutBody.paymentMethod === 'paypalwpp' ||
        checkoutBody.paymentMethod === 'paypalpl'
      ) {
        const paypalResult: any = await firstValueFrom(
          this.apiService.checkoutCart(checkoutBody)
        );
        const paypalStatus =
          paypalResult?.data?.result ?? paypalResult?.result;
        const paypalCheckoutResult =
          paypalResult?.data?.checkoutResult ?? paypalResult?.checkoutResult;
        const redirectUrl =
          paypalCheckoutResult?.reDirectUrl ??
          paypalCheckoutResult?.redirectUrl;

        if (paypalStatus === 'OK' && redirectUrl) {
          window.location.href = redirectUrl;
          this.utilService.showToast('Redirecting to PayPal...', 'success');
        } else {
          this.utilService.showToast(
            paypalResult?.data?.error_message ||
              paypalResult?.error_message ||
              'Failed to initiate PayPal payment',
            'warning'
          );
          this.utilService.hideLoader();
        }
        return;
      }

      // FINAL CHECKOUT
      const checkoutResult: any = await firstValueFrom(
        this.apiService.checkoutCart(checkoutBody)
      );
      const checkoutData = checkoutResult?.data ?? checkoutResult;

      if (checkoutData?.result === 'OK') {
        const result =
          checkoutData?.checkoutResult || checkoutData?.data?.checkoutResult;

        if (result?.paymentSettled) {
          this.utilService.showToast(
            `Order Success! Order ID: ${result.orderID}`,
            'success'
          );
          this.router.navigate(['/']);
        } else if (result?.reDirectUrl) {
          window.location.href = result.reDirectUrl;
          this.utilService.showToast(
            'Redirecting to complete payment...',
            'success'
          );
        } else {
          this.utilService.showToast('Payment processing...', 'success');
          this.router.navigate(['/']);
        }
      } else {
        this.utilService.showToast(
          checkoutData?.error_message ||
            checkoutData?.errors?.message ||
            'Checkout failed. Please try again.',
          'danger'
        );
      }
    } catch (error: any) {
      console.error('Checkout error', error);
      const message =
        this.utilService.parseErrorMessage?.(error) ||
        error?.error?.message ||
        'Something went wrong!';
      this.utilService.showToast(message, 'danger');
    } finally {
      this.placingOrder = false;
      this.utilService.hideLoader();
    }
  }

  private async handlePaypalReturn(): Promise<void> {
    if (this.paypalConfirming) {
      return;
    }

    const { payerID, paymentID } = this.getPaypalReturnParams();

    if (!payerID || !paymentID) {
      return;
    }

    this.paypalConfirming = true;
    this.placingOrder = true;
    this.utilService.showLoader();
    let navigatedAway = false;

    try {
      const response: any = await firstValueFrom(
        this.apiService.confirmPaypalPayment({ payerID, paymentID })
      );
      const data = response?.data ?? response;

      if (data?.result === 'OK') {
        const checkoutResult = data?.checkoutResult;

        if (checkoutResult?.paymentSettled) {
          this.utilService.showToast(
            `Order Success! Order ID: ${checkoutResult.orderID}`,
            'success'
          );
          navigatedAway = true;
          await this.router.navigate(['/home']);
        } else {
          this.utilService.showToast('Payment processing...', 'success');
        }
      } else {
        this.utilService.showToast(
          data?.error_message || 'PayPal confirmation failed. Please try again.',
          'danger'
        );
      }
    } catch (error: any) {
      console.error('PayPal confirmation error', error);
      const message =
        this.utilService.parseErrorMessage?.(error) ||
        error?.error?.message ||
        'Something went wrong with PayPal confirmation!';
      this.utilService.showToast(message, 'danger');
    } finally {
      this.placingOrder = false;
      this.paypalConfirming = false;
      this.utilService.hideLoader();
      if (navigatedAway) {
        return;
      }
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          payerID: null,
          PayerID: null,
          paymentID: null,
          paymentId: null,
          payment_id: null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  private extractCouponCode(comments: string): string | null {
    const match = comments?.match(/COUPON:(\w+)/);
    return match?.[1] ?? null;
  }

  private watchPaypalReturn(): void {
    this.paypalReturnSub = this.route.queryParamMap.subscribe(() => {
      this.handlePaypalReturn();
    });
    this.handlePaypalReturn();
  }

  private getPaypalReturnParams(): {
    payerID: string | null;
    paymentID: string | null;
  } {
    const queryParams = this.route.snapshot.queryParamMap;
    const browserParams = this.getBrowserUrlParams();

    return {
      payerID:
        queryParams.get('payerID') ||
        queryParams.get('PayerID') ||
        queryParams.get('payerId') ||
        browserParams.get('payerID') ||
        browserParams.get('PayerID') ||
        browserParams.get('payerId'),
      paymentID:
        queryParams.get('paymentID') ||
        queryParams.get('paymentId') ||
        queryParams.get('payment_id') ||
        browserParams.get('paymentID') ||
        browserParams.get('paymentId') ||
        browserParams.get('payment_id'),
    };
  }

  private getBrowserUrlParams(): URLSearchParams {
    const params = new URLSearchParams(window.location.search);
    const hashQuery = window.location.hash.includes('?')
      ? window.location.hash.split('?')[1]
      : '';

    new URLSearchParams(hashQuery).forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });

    return params;
  }
}
