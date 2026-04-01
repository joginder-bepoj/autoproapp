import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonContent, IonInput, IonButton, RouterLink],
})
export class LoginComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() { }

  login() {
    this.router.navigate(['/home']);
  }
}
