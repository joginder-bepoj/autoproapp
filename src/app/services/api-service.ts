import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ApiService {

  constructor(private http: HttpClient) {}

  private api_base_url = environment.api_base_url;

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