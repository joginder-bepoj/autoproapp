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
  modelSearchQuery: string = '';
  vehicleSearchQuery: string = '';
  vinSearchQuery: string = '';

  tools = [
    { title: 'KEY CODES\nPIN CODES', icon: 'speedometer-outline', url: '/pin-codes' },
    { title: 'KEY BLANK\nCROSS-REF', icon: 'key-outline' },
    { title: 'LOCKSMITH\nREFERENCES', icon: 'book-outline', url: '/locksmith-references' },
    { title: 'TOOLS &\nREFERENCES', icon: 'construct-outline', url: '/tool-references' },
    { title: 'ARTICLES\n& TUTORIALS', icon: 'document-text-outline', url: '/Articles-Tutorials' },
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

  onModelSearch() {
    if (this.modelSearchQuery.trim()) {
      this.router.navigate(['/product-list'], { queryParams: { q: this.modelSearchQuery } });
    }
  }

  onVehicleSearch() {
    if (this.vehicleSearchQuery.trim()) {
      this.router.navigate(['/category'], { queryParams: { search: this.vehicleSearchQuery.toLocaleLowerCase() } });
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

  openProductCategoryPage() {
    console.log('openProductCategoryPage');
    this.router.navigate(['/product-category']);
  }

  navigateTo(url: string | undefined) {
    if (url) {
      this.router.navigate(['/pages' + url]);
    }
  }
}

