import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment.prod';

import { UtilService } from './util.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private utilService = inject(UtilService);

  constructor(private http: HttpClient) { }
  private api_base_url = '/V1/';

  login(data: any) {
    return this.http.post(this.api_base_url + 'customer/login', data);
  }

  getCustomerProfile(data: any = {}) {
    return this.http.get(this.api_base_url + 'customer/info', data);
  }

  searchProducts(searchTerm: string) {
    return this.http.get(this.api_base_url + 'product-search/' + searchTerm);
  }

  getProductDetail(itemID: number) {
    return this.http.get(this.api_base_url + 'product/detail/' + itemID);
  }

  submitFeedback(data: any) {
    return this.http.post(this.api_base_url + 'customer/feedback', data);
  }

  isLoggedIn(): boolean {
    return this.utilService.isLoggedIn();
  }

  logout() {
    this.utilService.logout();
  }
}
