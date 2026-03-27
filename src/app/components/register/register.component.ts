import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonItem, IonInput, IonButton, IonSelect, IonSelectOption } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [IonContent, IonItem, IonInput, IonButton, IonSelect, IonSelectOption, RouterLink],
})
export class RegisterComponent implements OnInit {

  constructor() { }

  ngOnInit() { }

}
