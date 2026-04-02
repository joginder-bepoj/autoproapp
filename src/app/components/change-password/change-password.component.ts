import { Component, OnInit } from '@angular/core';
import { IonIcon, IonInput } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  callOutline,
  saveOutline,
  lockClosedOutline,
  keyOutline,
  eyeOutline,
  lockOpenOutline,
  eyeOffOutline,
  shieldCheckmarkOutline,
  closeOutline,
  checkmarkOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  imports: [IonIcon, IonInput]
})
export class ChangePasswordComponent implements OnInit {

  constructor() {
    addIcons({
      personOutline,
      mailOutline,
      callOutline,
      saveOutline,
      lockClosedOutline,
      keyOutline,
      eyeOutline,
      lockOpenOutline,
      eyeOffOutline,
      shieldCheckmarkOutline,
      closeOutline,
      checkmarkOutline
    });
  }

  ngOnInit() { }

}
