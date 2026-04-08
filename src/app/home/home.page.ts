import { Component } from '@angular/core';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonIcon
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
    FormsModule,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    IonIcon
  ],
})
export class HomePage {
  mainSearchQuery: string = '';
  vehicleSearchQuery: string = '';
  vinSearchQuery: string = '';

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

  constructor(private router: Router) {
    addIcons({ searchOutline, carSportOutline, chevronForwardOutline, carOutline, keyOutline, barcodeOutline, cameraOutline, speedometerOutline, bookOutline, constructOutline, documentTextOutline, peopleOutline, notificationsOutline, personCircleOutline, arrowForwardOutline, chevronDownOutline });
  }

  onMainSearch() {
    if (this.mainSearchQuery.trim()) {
      this.router.navigate(['/product-list'], { queryParams: { q: this.mainSearchQuery } });
    }
  }

  onVehicleSearch() {
    if (this.vehicleSearchQuery.trim()) {
      this.router.navigate(['/product-list'], { queryParams: { q: this.vehicleSearchQuery } });
    }
  }

  onVinSearch() {
    if (this.vinSearchQuery.trim()) {
      this.router.navigate(['/product-list'], { queryParams: { q: this.vinSearchQuery } });
    }
  }

  openCategoryPage() {
    this.router.navigate(['/category']);
  }
}

