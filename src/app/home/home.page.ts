import { Component } from '@angular/core';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  searchOutline,
  chevronForwardOutline,
  speedometerOutline,
  keyOutline,
  bookOutline,
  constructOutline,
  documentTextOutline,
  peopleOutline,
  carOutline,
  notificationsOutline,
  personCircleOutline,
  barcodeOutline, carSportOutline, arrowForwardOutline, chevronDownOutline
} from 'ionicons/icons';




@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonIcon
  ],
})
export class HomePage {
  tools = [
    { title: 'KEY CODES\nPIN CODES', icon: 'speedometer-outline' },
    { title: 'KEY BLANK\nCROSS-REF', icon: 'key-outline' },
    { title: 'LOCKSMITH\nREFERENCES', icon: 'book-outline' },
    { title: 'SOFTWARE &\nUPDATES', icon: 'construct-outline' },
    { title: 'TECHNICAL\nARTICLES', icon: 'document-text-outline' },
    { title: 'PROFESSIONAL\nTALK', icon: 'people-outline' },
  ];

  popularSearches = [
    { label: 'Keys Cut', image: 'assets/images/key-fob.png' },
    { label: 'Tools Used', image: 'assets/images/machine.png' },
    { label: 'Latest Gear', image: 'assets/images/logo.png' },
  ];

  constructor() {
    addIcons({ searchOutline, carSportOutline, chevronForwardOutline, carOutline, keyOutline, barcodeOutline, cameraOutline, speedometerOutline, bookOutline, constructOutline, documentTextOutline, peopleOutline, notificationsOutline, personCircleOutline, arrowForwardOutline, chevronDownOutline });
  }
}

