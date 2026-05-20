import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApiService } from './api-service';
import { Storage } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';
import { AppToastService } from './app-toast.service';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private storage = inject(Storage);
  private customToast = inject(AppToastService);

  private _storageReady: Promise<Storage>;

  private readonly STORAGE_KEYS = {
    PRIVATE_KEY: 'privateKey',
    USER_PROFILE: 'userProfile',
    USER_EMAIL: 'userEmail',
    USER_PROFILE_LOADED: 'userProfileLoaded'
  };

  public currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$: Observable<any> = this.currentUserSubject.asObservable();
  private cartSubject = new BehaviorSubject<any>(null);
  public cart$ = this.cartSubject.asObservable();
  private ezPagesSubject = new BehaviorSubject<any[]>([]);
  public ezPages$ = this.ezPagesSubject.asObservable();

  private activeRequests = 0;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable().pipe(delay(0));

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

    // Subscribe to ApiService unauthorized events
    this.apiService.onUnauthorized.subscribe(() => {
      this.logout();
    });
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
    this.apiService.privateKey = this._privateKey;

    this._userEmail = await this.getSession(this.STORAGE_KEYS.USER_EMAIL);
    const profile = await this.getSession(this.STORAGE_KEYS.USER_PROFILE);

    // Fallback email to profile if email empty
    this.apiService.loginEmail = profile?.email || this._userEmail || '';

  }

  async setPrivateKey(key: string): Promise<void> {
    this._privateKey = key;
    this.apiService.privateKey = key;
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
    this.apiService.loginEmail = profile?.email || this._userEmail || '';
  }

  getUserProfile(): any {
    return this.currentUserSubject.value;
  }

  async setLoginEmail(email: string): Promise<void> {
    this._userEmail = email;
    this.apiService.loginEmail = this.currentUserSubject.value?.email || email;
    await this.setSession(this.STORAGE_KEYS.USER_EMAIL, email);
  }

  getLoginEmail(): string | null {
    return this._userEmail;
  }

  isLoggedIn(): boolean {
    return !!this._privateKey && !!this._userEmail;
  }

  async logout(): Promise<void> {
    try {
      const user = this.getUserProfile();
      if (user?.customerID) {
        const { deviceId } = await this.getDeviceInfo();
        const snapshot = await this.apiService.getDeviceSnapshot(user.customerID);
        if (snapshot) {
          for (const [slot, device] of Object.entries(snapshot) as any) {
            if (device?.deviceID?.toLowerCase() === deviceId?.toLowerCase() && !device?.removed) {
              await this.apiService.removeDeviceFirebase(user.customerID, slot).toPromise();
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Device removal failed during logout:', e);
    }
    const store = await this.ready();
    await store.clear();
    this._privateKey = null;
    this._userEmail = null;
    this.apiService.privateKey = null;
    this.apiService.loginEmail = null;
    this.currentUserSubject.next(null);
    this.cartSubject.next(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  async getDeviceInfo() {
    const platform = Capacitor.getPlatform();
    let deviceId = '';
    let model = '';

    if (platform === 'web') {
      deviceId = await this.storage.get('web_device_id');
      if (!deviceId) {
        deviceId = 'web-' + Math.random().toString(36).substring(2, 15);
        await this.storage.set('web_device_id', deviceId);
      }
      model = 'Browser';
    } else {
      deviceId = 'native-device-id';
      model = platform.toUpperCase() + ' Device';
    }

    return { deviceId, model };
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
    return this.apiService.constructAPIHeaders(methodSend, targetPath);
  }

  // constructCatalogueHeaders(methodSend: string, targetPath: string): any {
  //   const time = Math.floor(Date.now() / 1000).toString();

  //   const normalizedPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
  //   const message = "Method:" + methodSend + "\n" + "Request:/" + normalizedPath + "\n" + "Time:" + time;

  //   const privateKey = "n3j5b28ecfb5953f237303075";
  //   const authorization = this.nodeCompatibleHmacBase64(privateKey, message);

  //   const profile = this.getUserProfile();
  //   const email = profile?.email || this.getLoginEmail() || '';

  //   return {
  //     "Content-Type": "application/json",
  //     "Authorization": authorization,
  //     "Time": time,
  //     "Key": email,
  //     "apiKeyPublic": "zg7gy0p7gliy0dioipz0",
  //     "apiKeySecret": "n3j5b28ecfb5953f237303075",
  //   };
  // }
  getImgBaseUrl() {
    return "https://www.americankeysupply.com/images/";
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────

  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary', duration: number = 3000) {
    const type = color === 'primary' ? 'info' : color;
    this.customToast.show(message, type, duration);
  }

  // ─── Cart ──────────────────────────────────────────────────────────────────

  checkResponseForErrors(res: any): string | null {
    const dataArray = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : null);
    if (dataArray) {
      for (const item of dataArray) {
        if (item?.result === 'ERROR' && item?.errors) {
          return item.errors.message || 'An error occurred while updating the cart item';
        }
      }
    }
    return null;
  }

  addToCart(product: any, onError?: (err: any) => void) {
    if (!product) return;

    const cart = this.getCart();
    const existingItem = cart?.products?.find((item: any) => item.itemID === product.itemID);

    if (existingItem) {
      const combinedQty = (existingItem.qty || 0) + (product.qtyOrder || 1);
      this.updateCartQty({ ...existingItem, qty: combinedQty }, onError);

    } else {
      const payload = {
        "products": [
          {
            "itemID": product.itemID,
            "qty": product.qtyOrder,
          }
        ]
      };

      this.apiService.addToCart(payload).subscribe({
        next: (res: any) => {
          const errorMsg = this.checkResponseForErrors(res);
          if (errorMsg) {
            this.showToast(errorMsg, 'danger');
            if (onError) onError(errorMsg);
          } else {
            this.showToast('Product added to cart successfully', 'success');
          }
          this.refreshCart();
        },
        error: (err) => {
          const message = this.parseErrorMessage(err);
          this.showToast(message, 'danger');
          if (onError) onError(message);
        }
      });
    }
  }

  updateCartQty(product: any, onError?: (err: any) => void) {
    if (!product) return;

    if (product.qty <= 0) {
      this.removeFromCart(product, onError);
      return;
    }

    const payload = {
      "products": [
        {
          "itemID": product.itemID,
          "qty": product.qty,
        }
      ]
    }

    this.apiService.updateCart(payload, true).subscribe({
      next: (res: any) => {
        const errorMsg = this.checkResponseForErrors(res);
        if (errorMsg) {
          this.showToast(errorMsg, 'danger');
          if (onError) onError(errorMsg);
        } else {
          this.showToast('Cart updated successfully', 'success');
        }
        this.refreshCart(true);
      },
      error: (err) => {
        const message = this.parseErrorMessage(err);
        this.showToast(message, 'danger');
        if (onError) onError(message);
      }
    });
  }

  removeFromCart(product: any, onError?: (err: any) => void) {
    if (!product) return;

    const payload = {
      "products": [
        {
          "itemID": product.itemID,
          "qty": 0,
        }
      ]
    }

    this.apiService.updateCart(payload, true).subscribe({
      next: (res: any) => {
        const errorMsg = this.checkResponseForErrors(res);
        if (errorMsg) {
          this.showToast(errorMsg, 'danger');
          if (onError) onError(errorMsg);
        } else {
          this.showToast('Product removed from cart', 'success');
        }
        this.refreshCart(true);
      },
      error: (err) => {
        const message = this.parseErrorMessage(err);
        this.showToast(message, 'danger');
        if (onError) onError(message);
      }
    });
  }

  refreshCart(skipLoader: boolean = false) {
    this.apiService.getCartItems(skipLoader).subscribe(
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

  setEzPages(pages: any[]): void {
    this.ezPagesSubject.next(pages);
  }

  getEzPages(): any[] {
    return this.ezPagesSubject.value;
  }

  strToHex(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);

    let hex = '';
    bytes.forEach((b) => {
      hex += (b & 0xff).toString(16).toUpperCase().padStart(2, '0');
    });

    return hex;
  }

  /// nissan bcm 20 digit decrypt functions

  swapBuffer(buf: Uint8Array, offset: number, len: number) {
    for (let i = 0; i < len / 2; i++) {
      const a = buf[offset + len - 1 - i];
      buf[offset + len - 1 - i] = buf[offset + i];
      buf[offset + i] = a;
    }
  }

  nissanCRC(buf: Uint8Array, offset: number, len: number): number {
    let w = 0xffff;

    for (let i = 0; i < len; i++) {
      w ^= buf[offset + i];
      for (let j = 0; j < 8; j++) {
        if (w & 1) {
          w >>= 1;
          w ^= 0xa001;
        } else {
          w >>= 1;
        }
      }
    }

    return w & 0xffff;
  }

  toUint32Array(buf: Uint8Array, offset: number): Uint32Array {
    const view = new DataView(buf.buffer, offset, 8);
    return new Uint32Array([
      view.getUint32(0, true),
      view.getUint32(4, true),
    ]);
  }

  writeUint32Array(buf: Uint8Array, offset: number, arr: Uint32Array) {
    const view = new DataView(buf.buffer, offset, 8);
    view.setUint32(0, arr[0], true);
    view.setUint32(4, arr[1], true);
  }

  decryptBuf8(data: Uint32Array, key: Uint32Array) {
    let sum = 0xc6ef3720;

    while (sum !== 0) {
      data[1] -=
        (key[(sum >>> 11) & 3] + sum) ^
        (data[0] + ((data[0] >>> 5) ^ (data[0] << 4)));

      sum = (sum - 0x9e3779b9) >>> 0;

      data[0] -=
        (key[sum & 3] + sum) ^
        (data[1] + ((data[1] >>> 5) ^ (data[1] << 4)));
    }
  }

  encryptBuf8(data: Uint32Array, key: Uint32Array) {
    let sum = 0;

    for (let i = 0; i < 32; i++) {
      data[0] +=
        (key[sum & 3] + sum) ^
        (data[1] + ((data[1] >>> 5) ^ (data[1] << 4)));

      sum = (sum - 0x61c88647) >>> 0;

      data[1] +=
        (key[(sum >>> 11) & 3] + sum) ^
        (data[0] + ((data[0] >>> 5) ^ (data[0] << 4)));
    }
  }

  nissanDecryptTen(outData: Uint8Array): Uint8Array {
    const inData = new Uint8Array(outData);
    const bufKey = new Uint8Array([
      0x00, 0x00, 0xc9, 0x51, 0xec, 0x85, 0x48, 0x51,
      0xe7, 0x1c, 0x67, 0x19, 0xf8, 0x5b, 0x67, 0x81,
      0x00, 0x00, 0xf3, 0xc1, 0x5c, 0x3e, 0xd0, 0x5f,
      0x6e, 0x78, 0xef, 0x8f, 0x91, 0xbc, 0xbc, 0xb0,
    ]);

    // copy first 2 bytes
    bufKey.set(outData.slice(0, 2), 0);
    bufKey.set(outData.slice(0, 2), 0x10);

    this.swapBuffer(inData, 2, 4);
    this.swapBuffer(inData, 6, 4);

    for (let i = 0; i < 8; i++) {
      this.swapBuffer(bufKey, i * 4, 4);
    }

    const data = this.toUint32Array(inData, 2);
    const key1 = this.toUint32Array(bufKey, 0x10);
    this.decryptBuf8(data, key1);
    this.writeUint32Array(inData, 2, data);

    const key2 = this.toUint32Array(bufKey, 0);
    this.encryptBuf8(data, key2);
    this.writeUint32Array(inData, 2, data);

    const check = this.nissanCRC(inData, 2, 8);

    inData[0] = (check >> 8) & 0xff;
    inData[1] = check & 0xff;

    this.swapBuffer(inData, 2, 4);
    this.swapBuffer(inData, 6, 4);

    return inData;
  }

  convert(input: string): string {
    const inBuff = new Uint8Array(10);

    for (let i = 0; i < 10; i++) {
      const first = input.charCodeAt(i * 2);
      const second = input.charCodeAt(i * 2 + 1);

      inBuff[i] =
        (((first - 0x30) * 16) + (second - 0x30)) & 0xFF;
    }

    const outBuff = this.nissanDecryptTen(inBuff);

    let result = '';

    for (let i = 0; i < 10; i++) {
      result += outBuff[i].toString(16).padStart(2, '0').toUpperCase();
    }

    return result;
  }


}
