import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonSelect, IonSelectOption, IonToggle, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [IonContent, IonInput, IonButton, IonSelect, IonSelectOption, RouterLink, CommonModule, FormsModule, IonToggle, IonLabel, IonIcon],
})
export class RegisterComponent implements OnInit {
  currentStep: number = 1;
  subscribeNewsletter: boolean = false;
  otherInfo: boolean = false;

  constructor(private router: Router) {
    addIcons({ cameraOutline, arrowBackOutline });
  }

  ngOnInit() { }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  submitForm() {
    console.log('Form submitted');
    this.router.navigate(['/home']);
    // Add your form submission logic here
  }

  submitOtherInfo() {
    this.otherInfo = !this.otherInfo;
  }
}
