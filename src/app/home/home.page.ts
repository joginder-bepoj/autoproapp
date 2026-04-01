import { Component } from '@angular/core';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonButton,
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
  barcodeOutline, carSportOutline
} from 'ionicons/icons';




@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonButton,
    IonIcon
  ],
})
export class HomePage {
  tools = [
    { title: 'KEY CODES\nPIN CODES', icon: 'speedometer-outline' },
    { title: 'KEY BLANK\nCROSS-REF', icon: 'key-outline' },
    { title: 'LOCKSMITH\nREFERENCES', icon: 'book-outline' },
    { title: 'TOOL\nREFERENCES', icon: 'construct-outline' },
    { title: 'ARTICLES &\nTUTORIALS', icon: 'document-text-outline' },
    { title: 'TECH\nTALK', icon: 'people-outline' },
  ];

  popularSearches = [
    { label: 'Keys Cut', image: 'assets/images/key-fob.png' },
    { label: 'Tools Used', image: 'assets/images/machine.png' },
    { label: 'Latest Gear', image: 'assets/images/logo.png' },
  ];

  constructor() {
    addIcons({ searchOutline, carSportOutline, chevronForwardOutline, carOutline, keyOutline, barcodeOutline, cameraOutline, speedometerOutline, bookOutline, constructOutline, documentTextOutline, peopleOutline, notificationsOutline, personCircleOutline });
  }
}

