import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  constructor(private http: HttpClient) { }
  private api_base_url = environment.api_base_url;

  login(data: any) {
    return this.http.post(this.api_base_url + 'customer/login', data);
  }

}
