import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonContent, IonItem, IonInput, IonButton, RouterLink],
})
export class LoginComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}
