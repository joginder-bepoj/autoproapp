import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private router = inject(Router);

  private readonly STORAGE_KEYS = {
    PRIVATE_KEY: 'privateKey',
    USER_PROFILE: 'userProfile',
    USER_EMAIL: 'userEmail'
  };

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$: Observable<any> = this.currentUserSubject.asObservable();

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
    // We no longer save the full profile to session storage to keep it minimalist
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
    return !!this.getPrivateKey();
  }

  logout(): void {
    // sessionStorage.removeItem(this.STORAGE_KEYS.PRIVATE_KEY);
    // sessionStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE);
    // sessionStorage.removeItem(this.STORAGE_KEYS.USER_EMAIL);
    // this.currentUserSubject.next(null);
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
    console.log(time, methodSend, targetPath, 'time methodSend targetPath');
    const message = "Method:" + methodSend + "\n" + "Request:/V1/" + targetPath + "\n" + "Time:" + time;

    const privateKey = await this.getFromAsyncStorage(this.STORAGE_KEYS.PRIVATE_KEY);
    if (!privateKey) {
      throw new Error("AUTH_MISSING: No private key found. User needs to log in.");
    }

    const authorization = this.nodeCompatibleHmacBase64(privateKey, message);

    // Key Logic: Use in-memory profile email if available, otherwise fallback to persisted email
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
}
