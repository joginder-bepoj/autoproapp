import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonInput, IonButton } from '@ionic/angular/standalone';
import { ApiService } from 'src/app/services/api-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonInput, IonButton, RouterLink, FormsModule, NgIf],
})
export class LoginComponent implements OnInit {

  constructor(private router: Router, private apiService: ApiService) { }
  loginData = {
    email: '',
    password: ''
  }
  forgotPass = false;

  ngOnInit() {

  }

  login() {
    this.router.navigate(['/home']);
    this.apiService.login({ email: this.loginData.email, password: this.loginData.password }).subscribe({
      next: (res: any) => {
        // alert(JSON.stringify(res));
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        console.log(err);
      }

    });
  }

  resetPassword() {
    this.router.navigate(['/home']);
    // this.apiService.resetPassword({ email: this.loginData.email }).subscribe({
    //   next: (res: any) => {
    //     alert(JSON.stringify(res));
    //     this.forgotPass = false;
    //   },
    //   error: (err: any) => {
    //     console.log(err);
    //   }
    // });
  }
}
