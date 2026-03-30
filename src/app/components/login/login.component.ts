import { Component, OnInit } from '@angular/core';
import { IonContent, IonInput, IonButton, IonItem, IonInputPasswordToggle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [IonItem, IonContent, IonInput, IonButton, IonInputPasswordToggle],
})
export class LoginComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}
