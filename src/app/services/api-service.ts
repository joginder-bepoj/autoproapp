import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  public onUnauthorized = new Subject<void>();
  public privateKey: string | null = null;
  public loginEmail: string | null = null;

  constructor(private http: HttpClient) { }

  private api_base_url = environment.api_base_url;



  nodeCompatibleHmacBase64(key: string, data: string): string {
    const mac = CryptoJS.HmacSHA512(data, key);
    const hex = CryptoJS.enc.Hex.stringify(mac);
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(hex));
  }

  constructAPIHeaders(methodSend: string, targetPath: string): any {
    const time = Math.floor(Date.now() / 1000).toString();

    const normalizedPath = targetPath.startsWith('/') ? targetPath.substring(1) : targetPath;
    const message = "Method:" + methodSend + "\n" + "Request:/" + normalizedPath + "\n" + "Time:" + time;

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

  private request(
    method: 'GET' | 'POST',
    url: string,
    data: any = null
  ): Observable<any> {
    if (method === 'GET') {
      return this.http.get(url);
    } else {
      return this.http.post(url, data);
    }
  }

  // =========================
  // 🔐 CUSTOMER APIs
  // =========================

  login(data: any) {
    return this.request('POST', this.api_base_url + 'customer/login', data);
  }

  getCustomerProfile() {
    return this.request('GET', this.api_base_url + 'customer/info');
  }

  submitFeedback(data: any) {
    return this.request('POST', this.api_base_url + 'customer/feedback', data);
  }

  // =========================
  // 📦 PRODUCT APIs
  // =========================

  searchProducts(searchTerm: string) {
    return this.request('GET', this.api_base_url + 'product-search/' + searchTerm);
  }

  getProductDetail(itemID: number) {
    return this.request('GET', this.api_base_url + 'product-info/' + itemID);
  }

  // =========================
  // 🛒 CART APIs
  // =========================

  getCartItems() {
    return this.request('GET', this.api_base_url + 'cart');
  }

  addToCart(data: any) {
    return this.request('POST', this.api_base_url + 'cart/add', data);
  }

  // =========================
  // 🔥 FIREBASE APIs
  // =========================

  getCategoryList() {
    return this.request(
      'GET',
      environment.api_firebase_url + 'vehicle_category_list/categoryList.json'
    );
  }

  getVehicleDetail(vehicleId: string) {
    return this.request(
      'GET',
      environment.api_firebase_url + 'vehicle1/' + vehicleId + '.json'
    );
  }
}