import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

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

  // category apis

  // getCategoryList() {
  //   return this.http.get(this.api_base_url + 'categories');
  // }

  // getVehicleMakeList() {
  //   return this.http.get(this.api_base_url + 'vehicle');
  // }

  // getVehicleModelList(id: number) {
  //   return this.http.get(this.api_base_url + 'vehicle-model/' + id);
  // }

  // getVehicleYearList(id: number) {
  //   return this.http.get(this.api_base_url + 'vehicle-year/' + id);
  // }

  // getVehicleProductList(id: number) {
  //   return this.http.get(this.api_base_url + 'vehicle-product/' + id);
  // }

  // getVehicleInfo(id: number) {
  //   return this.http.get(this.api_base_url + 'vehicle1/' + id + '/vehicle_info.json');
  // }

  // getVehicleCategoryList() {
  //   return this.http.get('https://vpic.nhtsa.dot.gov/api/vehicle_category_list.json');
  // }


  // cart apis

  getCartItems() {
    return this.http.get(this.api_base_url + 'cart');
  }

  addToCart(data: any) {
    return this.http.post(this.api_base_url + 'cart/add', data);
  }


  // firebase apis

  getCategoryList() {
    return this.http.get(environment.api_firebase_url + 'vehicle_category_list/categoryList.json');
  }

  getVehicleDetail(vehicleId: string) {
    return this.http.get(environment.api_firebase_url + 'vehicle1/' + vehicleId + '.json');
  }
}
