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
    console.log(privateKey)
    if (privateKey) {
      this.router.navigate(['/home']);
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
        this.utilService.hideLoader();
        const privateKey = res?.data?.privateKey;

        if (privateKey) {
          this.utilService.setPrivateKey(privateKey);
          this.utilService.setLoginEmail(this.loginData.email);
          this.apiService.getCustomerProfile().subscribe(
            (profile: any) => {
              if (profile && profile?.data) {
                this.utilService.setUserProfile(profile.data);
                this.router.navigate(['/home']);
              }
            },
            (err) => {
              console.error('Initial login sync failed:', err);
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
    // this.apiService.resetPassword({ email: this.loginData.email }).subscribe(
    //   (res: any) => {
    //     alert(JSON.stringify(res));
    //     this.forgotPass = false;
    //   },
    //   (err: any) => {
    //     console.log(err);
    //   }
    // );
  }
}
