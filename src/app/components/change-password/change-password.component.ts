import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit } from '@angular/core';
import { IonIcon, IonInput, IonContent } from "@ionic/angular/standalone";
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
  imports: [IonContent, IonIcon, IonInput, FooterComponent]
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
