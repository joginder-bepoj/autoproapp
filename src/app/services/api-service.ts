import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private utilService = inject(UtilService);

  constructor(private http: HttpClient) { }
  // private api_base_url = '/V1/';
  private api_base_url = environment.api_base_url;

  // customer apis
  login(data: any) {
    return this.http.post(this.api_base_url + 'customer/login', data);
  }

  getCustomerProfile(data: any = {}) {
    return this.http.get(this.api_base_url + 'customer/info', data);
  }

  submitFeedback(data: any) {
    return this.http.post(this.api_base_url + 'customer/feedback', data);
  }

  // isLoggedIn(): boolean {
  //   return this.utilService.isLoggedIn();
  // }

  // logout() {
  //   this.utilService.logout();
  // }

  // product apis

  searchProducts(searchTerm: string) {
    return this.http.get(this.api_base_url + 'product-search/' + searchTerm);
  }

  getProductDetail(itemID: number) {
    return this.http.get(this.api_base_url + 'product-info/' + itemID);
  }

  // cart apis

  getCartItems() {
    return this.http.get(this.api_base_url + 'cart');
  }

  addToCart(data: any) {
    return this.http.post(this.api_base_url + 'cart/add', data);
  }
}
