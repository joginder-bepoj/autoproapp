import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  public onUnauthorized = new Subject<void>();
  public privateKey: string | null = null;
  public loginEmail: string | null = null;

  private api_base_url = environment.api_base_url;

  constructor(private http: HttpClient) { }

  // =========================
  // 🔐 HMAC GENERATOR
  // =========================

  nodeCompatibleHmacBase64(key: string, data: string): string {
    const mac = CryptoJS.HmacSHA512(data, key);
    const hex = CryptoJS.enc.Hex.stringify(mac);
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(hex));
  }

  constructAPIHeaders(methodSend: string, targetPath: string): any {
    const time = Math.floor(Date.now() / 1000).toString();
    const normalizedPath = targetPath.startsWith('/')
      ? targetPath.substring(1)
      : targetPath;

    const message =
      "Method:" + methodSend +
      "\nRequest:/" + normalizedPath +
      "\nTime:" + time;

    const key = this.privateKey || "";
    const authorization = this.nodeCompatibleHmacBase64(key, message);
    const email = this.loginEmail || '';

    return {
      "Content-Type": "application/json",
      "Authorization": authorization,
      "Time": time,
      "Key": email,
      "apiKeyPublic": "zg7gy0p7gliy0dioipz0",
      "apiKeySecret": "n3j5b28ecfb5953f237303075",
    };
  }

  // =========================
  // 🚀 UNIVERSAL REQUEST
  // =========================

  private request(
    method: 'GET' | 'POST',
    endpoint: string,
    data: any = null
  ): Observable<any> {

    const headers = this.constructAPIHeaders(method, endpoint);
    const fullUrl = this.api_base_url + endpoint;

    // 👉 Native (Android / iOS)
    if (Capacitor.isNativePlatform()) {

      const options: any = {
        url: fullUrl,
        headers,
        method,
      };

      if (method === 'POST') {
        options.data = data;
      }

      return from(
        CapacitorHttp.request(options).then((response: any) => {
          if (response.status === 401) {
            this.onUnauthorized.next();
          }
          return response.data;
        })
      );
    }

    // 👉 Web Browser
    else {
      if (method === 'GET') {
        return this.http.get(fullUrl, { headers });
      } else {
        return this.http.post(fullUrl, data, { headers });
      }
    }
  }

  // =========================
  // 🔐 CUSTOMER APIs
  // =========================

  login(data: any) {
    return this.request('POST', 'customer/login', data);
  }

  getCustomerProfile() {
    // return this.http.get(this.api_base_url + 'customer/info',)
    return this.request('GET', 'customer/info');
  }

  submitFeedback(data: any) {
    return this.request('POST', 'customer/feedback', data);
  }

  getCustomerPoints() {
    return this.request('GET', 'customer/points');
  }

  updateCustomerPoints(points: number, reason: string) {
    const data = {
      points: points,
      reason: reason
    };
    return this.request('POST', 'customer/points', data);
  }

  // =========================
  // 📦 PRODUCT APIs
  // =========================

  searchProducts(searchTerm: string) {
    return this.request('GET', 'product-search/' + searchTerm);
  }

  getProductDetail(itemID: number) {
    return this.request('GET', 'product-info/' + itemID);
  }

  getProductCategories() {
    return this.request('GET', 'categories');
  }

  getProductsByCategory(id: string) {
    return this.request('GET', 'categories/' + id);
  }

  // =========================
  // 🛒 CART APIs
  // =========================

  getCartItems() {
    return this.request('GET', 'cart');
  }

  addToCart(data: any) {
    return this.request('POST', 'cart/add', data);
  }

  // =========================
  // 🔥 FIREBASE APIs (WEB ONLY SAFE)
  // =========================

  getCategoryList() {
    return this.http.get(
      environment.api_firebase_url +
      'vehicle_category_list/categoryList.json'
    );
  }

  getVehicleDetail(vehicleId: string) {
    return this.http.get(
      environment.api_firebase_url +
      'vehicle1/' + vehicleId + '.json'
    );
  }

  getKeyBlanks() {
    return this.http.get(
      environment.api_firebase_url +
      'app_keys.json'
    );
  }

  getEzPages() {
    return this.http.get(
      environment.api_firebase_url +
      'ez_pages.json'
    );
  }

  checkNissan5BcmLimit(userId: string) {
    return this.http.get(
      environment.api_firebase_url +
      'users/' + userId + '/nissan5_conversion_logs.json'
    );
  }

  getNissan5BcmPin(bcm: string): Observable<any> {
    return this.http.get(
      environment.api_firebase_url +
      'NissanBCM5/' + bcm + '.json'
    );
  }

  logNissan5BcmConversion(userId: string, timestamp: number): Observable<any> {
    return this.http.post(
      environment.api_firebase_url +
      'users/' + userId + '/nissan5_conversion_logs.json',
      timestamp
    );
  }

}