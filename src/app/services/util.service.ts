import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { ToastController } from '@ionic/angular';
import * as CryptoJS from 'crypto-js';
import { ApiService } from './api-service';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private router = inject(Router);
  private toastController = inject(ToastController);
  private apiService = inject(ApiService);
  private storage = inject(Storage);

  private _storageReady: Promise<Storage>;

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

  constructor() {
    // Initialise Ionic Storage once; reuse the same promise everywhere
    this._storageReady = this.storage.create();
  }

  /** Ensures storage is initialised before use */
  private async ready(): Promise<Storage> {
    return this._storageReady;
  }

  // ─── Core storage helpers ──────────────────────────────────────────────────

  async setSession(key: string, value: any): Promise<void> {
    const store = await this.ready();
    const serialised = typeof value === 'object' ? JSON.stringify(value) : value;
    await store.set(key, serialised);
  }

  async getSession(key: string): Promise<any> {
    const store = await this.ready();
    const value = await store.get(key);
    if (value === null || value === undefined) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // ─── Auth helpers ──────────────────────────────────────────────────────────

  private _privateKey: string | null = null;
  private _userEmail: string | null = null;

  async initStorage(): Promise<void> {
    await this.ready();
    this._privateKey = await this.getSession(this.STORAGE_KEYS.PRIVATE_KEY);
    this._userEmail = await this.getSession(this.STORAGE_KEYS.USER_EMAIL);
  }

  async setPrivateKey(key: string): Promise<void> {
    this._privateKey = key;
    await this.setSession(this.STORAGE_KEYS.PRIVATE_KEY, key);
  }

  getPrivateKey(): string | null {
    return this._privateKey;
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

  async setLoginEmail(email: string): Promise<void> {
    this._userEmail = email;
    await this.setSession(this.STORAGE_KEYS.USER_EMAIL, email);
  }

  getLoginEmail(): string | null {
    return this._userEmail;
  }

  isLoggedIn(): boolean {
    return !!this._privateKey;
  }

  async logout(): Promise<void> {
    const store = await this.ready();
    await store.clear();
    this.currentUserSubject.next(null);
    this.cartSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ─── Error / utility helpers ───────────────────────────────────────────────

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
    const store = await this.ready();
    return store.get(key);
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

  // ─── API header builders ───────────────────────────────────────────────────

  constructAPIHeaders(methodSend: string, targetPath: string): any {
    const time = Math.floor(Date.now() / 1000).toString();

    const normalizedPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
    const message = "Method:" + methodSend + "\n" + "Request:/" + normalizedPath + "\n" + "Time:" + time;

    const privateKey = this.getPrivateKey() || "";
    const authorization = this.nodeCompatibleHmacBase64(privateKey, message);

    const profile = this.getUserProfile();
    const email = profile?.email || this.getLoginEmail() || '';

    return {
      "Content-Type": "application/json",
      "Authorization": authorization,
      "Time": time,
      "Key": email,
      "apiKeyPublic": "zg7gy0p7gliy0dioipz0",
      "apiKeySecret": "n3j5b28ecfb5953f237303075",
    };
  }

  constructCatalogueHeaders(methodSend: string, targetPath: string): any {
    const time = Math.floor(Date.now() / 1000).toString();

    const normalizedPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
    const message = "Method:" + methodSend + "\n" + "Request:/" + normalizedPath + "\n" + "Time:" + time;

    const privateKey = "n3j5b28ecfb5953f237303075";
    const authorization = this.nodeCompatibleHmacBase64(privateKey, message);

    const profile = this.getUserProfile();
    const email = profile?.email || this.getLoginEmail() || '';

    return {
      "Content-Type": "application/json",
      "Authorization": authorization,
      "Time": time,
      "Key": email,
      "apiKeyPublic": "zg7gy0p7gliy0dioipz0",
      "apiKeySecret": "n3j5b28ecfb5953f237303075",
    };
  }

  getImgBaseUrl() {
    return "https://www.americankeysupply.com/images/";
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────

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

  // ─── Cart ──────────────────────────────────────────────────────────────────

  addToCart(product: any) {
    if (!product) return;

    const payload = {
      "products": [
        {
          "itemID": product.itemID,
          "qty": product.qtyOrder,
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
