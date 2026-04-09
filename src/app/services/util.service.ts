import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';
import * as CryptoJS from 'crypto-js';
import { ApiService } from './api-service';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private router = inject(Router);
  private toastController = inject(ToastController);
  private apiService = inject(ApiService);

  private readonly STORAGE_KEYS = {
    PRIVATE_KEY: 'privateKey',
    USER_PROFILE: 'userProfile',
    USER_EMAIL: 'userEmail',
    USER_PROFILE_LOADED: 'userProfileLoaded'
  };

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$: Observable<any> = this.currentUserSubject.asObservable();
  private cartSubject = new BehaviorSubject<any>(null);
  public cart$: Observable<any> = this.cartSubject.asObservable();

  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  showLoader() {
    this.activeRequests++;
    this.isLoadingSubject.next(true);
  }

  hideLoader() {
    this.activeRequests--;

    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.isLoadingSubject.next(false);
    } else {
      this.isLoadingSubject.next(true);
    }
  }

  constructor() { }

  setSession(key: string, value: any): void {
    if (typeof value === 'object') {
      sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      sessionStorage.setItem(key, value);
    }
  }

  getSession(key: string): any {
    const value = sessionStorage.getItem(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return value;
    }
  }

  setPrivateKey(key: string): void {
    this.setSession(this.STORAGE_KEYS.PRIVATE_KEY, key);
  }

  getPrivateKey(): string | null {
    return this.getSession(this.STORAGE_KEYS.PRIVATE_KEY);
  }

  setUserProfile(profile: any): void {
    if (profile) {
      this.setSession(this.STORAGE_KEYS.USER_PROFILE_LOADED, 'true');
    }
    this.currentUserSubject.next(profile);
  }

  getUserProfile(): any {
    return this.currentUserSubject.value; // Return in-memory state
  }

  setLoginEmail(email: string): void {
    this.setSession(this.STORAGE_KEYS.USER_EMAIL, email);
  }

  getLoginEmail(): string | null {
    return this.getSession(this.STORAGE_KEYS.USER_EMAIL);
  }

  isLoggedIn(): boolean {
    const hasKey = !!this.getPrivateKey();
    // const hasProfile = !!this.getSession(this.STORAGE_KEYS.USER_PROFILE_LOADED);
    return hasKey;
  }

  logout(): void {
    sessionStorage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  parseErrorMessage(err: any): string {
    const errorBody = err.error;
    const errorData = errorBody?.errors || errorBody?.data?.errors;
    let message = errorData?.message || errorBody?.message || err.message || 'An error occurred';

    if (errorData?.code === '4' && message === 'email') {
      return 'Please enter a valid email address.';
    } else if (errorData?.code === '401' || errorData?.code === '5' || message === 'Failed to Authenticate.') {
      return 'Incorrect email or password. Please try again.';
    }

    return message;
  }

  nodeCompatibleHmacBase64(key: string, data: string): string {
    const mac = CryptoJS.HmacSHA512(data, key);
    const hex = CryptoJS.enc.Hex.stringify(mac);
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(hex));
  }

  async getFromAsyncStorage(key: string): Promise<string | null> {
    return sessionStorage.getItem(key);
  }

  async getParsedAsyncStorageData(key: string): Promise<any> {
    const details = await this.getFromAsyncStorage(key);
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch (e) {
      console.error(`Failed to parse AsyncStorage data for key "${key}":`, e);
      return null;
    }
  }

  async constructAPIHeaders(methodSend: string, targetPath: string): Promise<any> {
    const time = Math.floor(Date.now() / 1000).toString();

    // Normalize targetPath: ensure it doesn't have a leading slash first, then prepend one.
    // This matches the React logic: "Request:/" + targetPath
    const normalizedPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
    const message = "Method:" + methodSend + "\n" + "Request:/" + normalizedPath + "\n" + "Time:" + time;

    const privateKey = (await this.getFromAsyncStorage(this.STORAGE_KEYS.PRIVATE_KEY)) || "";
    const authorization = this.nodeCompatibleHmacBase64(privateKey, message);

    const profile = this.getUserProfile();
    const email = profile?.email || this.getLoginEmail() || '';

    return {
      "Content-Type": "application/json",
      "Authorization": authorization,
      "Time": time,
      "Key": email,
      // "apiKeyPublic": "zg7gy0p7gliy0dioipz0",
      // "apiKeySecret": "n3j5b28ecfb5953f237303075",
    };
  }

  async constructCatalogueHeaders(methodSend: string, targetPath: string): Promise<any> {
    const time = Math.floor(Date.now() / 1000).toString();

    // Consistent with constructAPIHeaders and React logic
    const normalizedPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
    const message = "Method:" + methodSend + "\n" + "Request:/" + normalizedPath + "\n" + "Time:" + time;

    // Different credentials for Catalogue - using apiKeySecret as the private key for signing
    // As per user requirement: "The API's in blue will have a different credentials to the admin"
    const privateKey = "n3j5b28ecfb5953f237303075";
    const authorization = this.nodeCompatibleHmacBase64(privateKey, message);

    const profile = this.getUserProfile();
    const email = profile?.email || this.getLoginEmail() || '';

    return {
      "Content-Type": "application/json",
      "Authorization": authorization,
      "Time": time,
      "Key": email,
    };
  }

  getImgBaseUrl() {
    return "https://www.americankeysupply.com/images/";
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary', duration: number = 3000000) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'top',
      positionAnchor: 'app-header',
      cssClass: `premium-top-right-toast toast-${color}`,

      buttons: [
        {
          text: 'Ok',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }



  addToCart(product: any) {
    if (!product) return;

    // const optionsPayload = Object.keys(product.options).map(optionId => {
    //   const option = product?.options?.find((o: any) => o.id == optionId);
    //   const isText = option?.type === 'text';
    //   return {
    //     id: parseInt(optionId),
    //     valueID: isText ? 0 : parseInt(selectedOptions[optionId]),
    //     valueText: isText ? selectedOptions[optionId] : ''
    //   };
    // });

    const payload = {
      "products": [
        {
          "itemID": product.itemID,
          "qty": product.qtyOrder,
          // "options": optionsPayload
        }
      ]
    }

    this.apiService.addToCart(payload).subscribe({
      next: (res: any) => {
        this.showToast('Product added to cart successfully', 'success');
        this.refreshCart();
      },

      error: (err) => {
        const message = this.parseErrorMessage(err);
        this.showToast(message, 'danger');
      }
    });
  }

  refreshCart() {
    this.apiService.getCartItems().subscribe(
      (cart: any) => {
        if (cart && cart?.data) {
          this.setCart(cart.data);
        }
      }
    );
  }

  setCart(cart: any): void {
    this.cartSubject.next(cart);
  }

  getCart(): any {
    return this.cartSubject.value;
  }
}
