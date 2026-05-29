import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import * as CryptoJS from 'crypto-js';
import { Database, ref, onValue, update, get, set, push, serverTimestamp, remove, query, limitToLast } from '@angular/fire/database';
import { Storage, ref as storageRef, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  public onUnauthorized = new Subject<void>();
  public privateKey: string | null = null;
  public loginEmail: string | null = null;

  private api_base_url = environment.api_base_url;

  constructor(private http: HttpClient, private db: Database, private storage: Storage) { }

  // =========================
  // HMAC GENERATOR
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
  // UNIVERSAL REQUEST
  // =========================

  private request(
    method: 'GET' | 'POST',
    endpoint: string,
    data: any = null,
    skipLoader: boolean = false
  ): Observable<any> {

    let headers = this.constructAPIHeaders(method, endpoint);
    if (skipLoader) {
      headers = { ...headers, 'X-Skip-Loader': 'true' };
    }
    const fullUrl = this.api_base_url + endpoint;

    // Native (Android / iOS)
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

    // Web Browser
    else {
      if (method === 'GET') {
        return this.http.get(fullUrl, { headers });
      } else {
        return this.http.post(fullUrl, data, { headers });
      }
    }
  }

  // fetchExternalPdfs(url: string): Observable<any> {
  //   if (Capacitor.isNativePlatform()) {
  //     const options: any = {
  //       url: url,
  //       method: 'GET',
  //       responseType: 'arraybuffer'
  //     };

  //     return from(
  //       CapacitorHttp.request(options).then((response: any) => {
  //         return response;
  //       })
  //     );
  //   } else {
  //     return this.http.get(url, {
  //       responseType: 'blob',
  //       observe: 'response'
  //     });
  //   }
  // }
  // =========================
  // CUSTOMER APIs
  // =========================

  login(data: any) {
    return this.request('POST', 'customer/login', data);
  }

  getCustomerProfile() {
    return this.request('GET', 'customer/info');
  }

  submitFeedback(data: any) {
    return this.request('POST', 'customer/feedback', data);
  }

  getCustomerPoints() {
    return this.request('GET', 'customer/points');
  }

  getCustomerQuestion() {
    return this.request('GET', 'customer/question');
  }

  getOrderHistory() {
    return this.request('GET', 'customer/order-history');
  }

  getOrderHistoryDetails(orderId: string) {
    return this.request('GET', 'customer/order-history/' + orderId);
  }

  createCustomer(data: any) {
    return this.request('POST', 'customer/create', data);
  }

  updateCustomerInfo(data: any) {
    return this.request('POST', 'customer/info/edit', data);
  }

  getCustomerCreditCards() {
    return this.request('GET', 'customer/credit-card');
  }

  addCustomerCreditCard(data: any) {
    return this.request('POST', 'customer/credit-card/add', data);
  }

  updateCustomerPoints(points: number, reason: string) {
    const data = {
      points: points,
      reason: reason
    };
    return this.request('POST', 'customer/points', data);
  }

  getCustomerContributions(userId: string): Observable<any> {
    const contributionsRef = ref(this.db, `users/${userId}/contributions`);
    return new Observable(observer => {
      onValue(contributionsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const counts = {
          vehicle_images: data.vehicle_images ? Object.keys(data.vehicle_images).length : 0,
          corrections: data.corrections ? Object.keys(data.corrections).length : 0,
          keymaking: data.keymaking ? Object.keys(data.keymaking).length : 0,
          tips_and_tricks: data.tips_and_tricks ? Object.keys(data.tips_and_tricks).length : 0,
          ratings: data.ratings ? Object.keys(data.ratings).length : 0,
          new_vehicles: data.new_vehicles ? Object.keys(data.new_vehicles).length : 0,
          feedbacks: data.feedbacks ? Object.keys(data.feedbacks).length : 0,
        };
        observer.next(counts);
      }, (error) => {
        observer.error(error);
      });
    });
  }

  getDeviceLogins(userId: string): Observable<any> {
    const loginsRef = ref(this.db, `users/${userId}/logins`);
    return new Observable(observer => {
      onValue(loginsRef, (snapshot) => {
        const val = snapshot.val();
        const logins = val ? Object.values(val) : [];
        let firstLogin = 0;
        if (logins.length > 0) {
          firstLogin = Number(logins[0]);
        }
        observer.next({
          count: logins.length,
          firstLogin: firstLogin
        });
      }, (error) => {
        observer.error(error);
      });
    });
  }

  loadDevices(userId: string) {
    const devicesRef = ref(this.db, `users/${userId}/devices`);
    return new Observable(observer => {
      onValue(devicesRef, (snapshot) => {
        observer.next(snapshot.val());
      }, (error) => {
        observer.error(error);
      });
    });
  }

  removeDeviceFirebase(userId: string, deviceKey: string) {
    const deviceRef = ref(this.db, `users/${userId}/devices/${deviceKey}`);
    return from(update(deviceRef, {
      removed: true,
      timeRemoved: Date.now()
    }));
  }

  async getDeviceSnapshot(userId: string): Promise<any> {
    const devicesRef = ref(this.db, `users/${userId}/devices`);
    const snapshot = await get(devicesRef);
    return snapshot.val();
  }

  async checkDevice(modelName: string, deviceID: string, userId: string): Promise<string> {
    const devicesRef = ref(this.db, `users/${userId}/devices`);
    const snapshot = await get(devicesRef);
    const devices = snapshot.val() || {};

    const device1 = devices.device1;
    const device2 = devices.device2;

    const isSameDevice = (d: any) =>
      d && d.deviceID?.toLowerCase() === deviceID.toLowerCase() && !d.removed;

    if (isSameDevice(device1) || isSameDevice(device2)) {
      return "already registered";
    }

    const isSameRemovedDevice = (d: any) =>
      d && d.deviceID?.toLowerCase() === deviceID.toLowerCase() && d.removed;

    const isAvailable = (d: any) => {
      if (!d) return true;
      if (!d.removed) return false;   // Slot is actively used by another device
      return true;                    // Slot was removed — always allow reuse
    };

    const registerDevice = async (slot: string) => {
      const deviceData = {
        platform: Capacitor.getPlatform(),
        modelName: modelName,
        deviceID: deviceID,
        removed: false,
        timeRegistered: Date.now()
      };
      await set(ref(this.db, `users/${userId}/devices/${slot}`), deviceData);
      return "newly registered";
    };

    if (isSameRemovedDevice(device1)) {
      return await registerDevice('device1');
    }

    if (isSameRemovedDevice(device2)) {
      return await registerDevice('device2');
    }

    if (isAvailable(device1)) {
      return await registerDevice('device1');
    }

    if (isAvailable(device2)) {
      return await registerDevice('device2');
    }

    // throw new Error("Device limit reached. You can only have 2 active devices.");
    return "limit bypassed";
  }

  logLogin(userId: string) {
    const loginsRef = ref(this.db, `users/${userId}/logins`);
    return from(push(loginsRef, serverTimestamp()));
  }

  logNissan5Conversion(userId: string) {
    const nissanRef = ref(this.db, `users/${userId}/nissan5_conversion_logs`);
    return from(push(nissanRef, serverTimestamp()));
  }

  async checkNissan5ConversionLimit(userId: string): Promise<'available' | 'daily_limit' | 'hourly_limit'> {
    const nissanRef = ref(this.db, `users/${userId}/nissan5_conversion_logs`);
    const q = query(nissanRef, limitToLast(20));
    const snapshot = await get(q);

    if (snapshot.exists()) {
      let triesInDay = 0;
      let triesInHour = 0;
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const oneDay = 24 * oneHour;

      snapshot.forEach(child => {
        const timestamp = Number(child.val());
        if (now - timestamp <= oneHour) triesInHour++;
        if (now - timestamp <= oneDay) triesInDay++;
      });

      if (triesInDay >= 20) return 'daily_limit';
      if (triesInHour >= 5) return 'hourly_limit';
    }
    return 'available';
  }

  addContribution(userId: string, type: string, key: string) {
    const contrRef = ref(this.db, `users/${userId}/contributions/${type}/${key}`);
    return from(set(contrRef, true));
  }

  uploadFeedbackAttachment(userId: string, file: File): Observable<string> {
    const safeName = file.name.replace(/[^\w.\-]+/g, '-');
    const fileRef = storageRef(this.storage, `feedback/${userId}/${Date.now()}-${safeName}`);
    const metadata = file.type ? { contentType: file.type } : undefined;
    return from(uploadBytes(fileRef, file, metadata).then(() => getDownloadURL(fileRef)));
  }

  sendFeedbackToFirebase(feedbackData: Record<string, any>): Observable<string> {
    const feedbackRef = push(ref(this.db, 'feedbacks'));
    return from(set(feedbackRef, feedbackData).then(() => feedbackRef.key || ''));
  }

  private getMachineToolsPath(userID: string): string {
    return `users/${userID}/settings/machineTools`;
  }

  getMachineToolSettings(userID: string): Observable<any> {
    const settingsRef = ref(this.db, this.getMachineToolsPath(userID));
    return new Observable(observer => {
      onValue(settingsRef, (snapshot) => {
        observer.next(snapshot.val());
      }, (error) => {
        observer.error(error);
      });
    });
  }

  saveMachineToolSetting(userID: string, groupName: string, childName: string, show: boolean) {
    const settingRef = ref(this.db, `${this.getMachineToolsPath(userID)}/${groupName}/${childName}`);
    if (show) {
      return from(remove(settingRef));
    } else {
      return from(set(settingRef, false));
    }
  }

  changeMachineToolSetting(userID: string, groupName: string, childName: string, show: boolean) {
    return this.saveMachineToolSetting(userID, groupName, childName, show);
  }

  getCommunicationPreferences(userID: string): Observable<any> {
    const settingsRef = ref(this.db, `users/${userID}/settings/communicationPreferences`);
    return new Observable(observer => {
      onValue(settingsRef, (snapshot) => {
        observer.next(snapshot.val());
      }, (error) => {
        observer.error(error);
      });
    });
  }

  saveCommunicationPreferences(userID: string, subscribeMarketingEmails: boolean) {
    const settingsRef = ref(this.db, `users/${userID}/settings/communicationPreferences`);
    return from(set(settingsRef, { subscribeMarketingEmails }));
  }

  // =========================
  // PRODUCT APIs
  // =========================

  searchProducts(searchTerm: string, page?: number) {
    let endpoint = 'product-search/' + searchTerm;
    if (page !== undefined && page !== null) {
      endpoint += '?page=' + page;
    }
    return this.request('GET', endpoint);
  }

  getProductDetail(itemID: number) {
    return this.request('GET', 'product-info/' + itemID);
  }

  getProductCategories() {
    return this.request('GET', 'categories');
  }

  getProductsByCategory(id: string, page?: number) {
    let endpoint = 'categories/' + id;
    if (page !== undefined && page !== null) {
      endpoint += '?page=' + page;
    }
    return this.request('GET', endpoint);
  }
  // =========================
  // CART APIs
  // =========================

  getCartItems(skipLoader: boolean = false) {
    return this.request('GET', 'cart', null, skipLoader);
  }

  addToCart(data: any) {
    return this.request('POST', 'cart/add', data);
  }

  updateCart(data: any, skipLoader: boolean = false) {
    return this.request('POST', 'cart/update', data, skipLoader);
  }

  removeFromCart(data: any, skipLoader: boolean = false) {
    return this.request('POST', 'cart/delete', data, skipLoader);
  }

  // =========================
  // FIREBASE APIs (AUTHENTICATED)
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

  vehicleSearchHistory(userId: string) {
    return this.http.get(
      environment.api_firebase_url +
      'search_history/' + userId + '.json'
    );
  }

  // getSearchHistory(userId: string): Observable<any> {
  //   const historyRef = ref(this.db, `search_history/${userId}`);
  //   return new Observable(observer => {
  //     onValue(historyRef, (snapshot) => {
  //       observer.next(snapshot.val());
  //     }, (error) => {
  //       observer.error(error);
  //     });
  //   });
  // }

}
