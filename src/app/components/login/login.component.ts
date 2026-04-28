import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonInput, IonButton, AlertController } from '@ionic/angular/standalone';
import { ApiService } from '../../services/api-service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonInput, IonButton, RouterLink, FormsModule, NgIf],
})
export class LoginComponent implements OnInit {

  constructor(
    private router: Router,
    private apiService: ApiService,
    private alertController: AlertController,
    private utilService: UtilService
  ) { }
  ngOnInit(): void {
    let privateKey = this.utilService.getPrivateKey();
    if (privateKey) {
      this.utilService.showLoader();
      this.apiService.getCustomerProfile().subscribe({
        next: (res: any) => {
          if (res?.data) {
            this.utilService.setUserProfile(res.data);
            this.utilService.hideLoader();
            this.router.navigate(['/home']);
          }
        },
        error: (err) => {
          this.utilService.hideLoader();
          console.error('Profile error:', err)
        }
      });
    }
  }
  loginData = {
    email: '',
    password: ''
  }
  forgotPass = false;

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  login() {
    this.utilService.showLoader();
    this.apiService.login(this.loginData).subscribe(
      (res: any) => {
        const privateKey = res?.data?.privateKey;

        if (privateKey) {
          this.utilService.setPrivateKey(privateKey);
          this.utilService.setLoginEmail(this.loginData.email);
          this.apiService.getCustomerProfile().subscribe(
            async (profile: any) => {
              if (profile && profile?.data) {
                const customerID = profile.data.customerID;

                try {
                  const info = await this.utilService.getDeviceInfo();
                  const deviceStatus = await this.apiService.checkDevice(info.model, info.deviceId, customerID);
                  this.apiService.logLogin(customerID).subscribe();

                  this.utilService.setUserProfile(profile.data);
                  this.utilService.hideLoader();
                  this.router.navigate(['/home']);

                } catch (deviceError: any) {
                  this.utilService.hideLoader();
                  this.showAlert('Device Limit Reached', deviceError.message || 'You can only have 2 active devices.');
                }
              }
            },
            (err) => {
              this.utilService.hideLoader();
              console.error('Initial login sync failed:', err);
              const errorMsg = this.utilService.parseErrorMessage(res);
              this.showAlert('Failed to fetch profile', errorMsg);
            }
          );

          // this.router.navigate(['/home']);
        } else {
          this.utilService.hideLoader();
          const errorMsg = this.utilService.parseErrorMessage(res);
          this.showAlert('Login Failed', errorMsg);
        }
      },
      (err: any) => {
        this.utilService.hideLoader();
        const errorMsg = this.utilService.parseErrorMessage(err);
        this.showAlert('Error', errorMsg);
        console.error('Login error', err);
      }
    );
  }

  resetPassword() {
    this.router.navigate(['/home']);

  }
}
