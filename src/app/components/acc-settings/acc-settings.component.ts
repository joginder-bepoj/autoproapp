import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline,
  bagHandleOutline,
  lockClosedOutline,
  locationOutline,
  cardOutline,
  notificationsOutline,
  constructOutline,
} from 'ionicons/icons';
import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { BreadcrumbsComponent } from 'src/app/shared/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-acc-settings',
  templateUrl: './acc-settings.component.html',
  styleUrls: ['./acc-settings.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent, IonIcon, BreadcrumbsComponent, FooterComponent],
})
export class AccSettingsComponent {

  readonly menuItems = [
    { label: 'Order History', icon: 'bag-handle-outline', route: '/order-history' },
    { label: 'Contact Info & Password', icon: 'lock-closed-outline', route: '/change-password' },
    { label: 'Shipping Address', icon: 'location-outline', route: '/profile' },
    { label: 'Credit Cards', icon: 'card-outline', route: '/profile' },
    { label: 'Communications Preferences', icon: 'notifications-outline', route: '/feedback' },
    { label: 'Machines & Tools Setup', icon: 'construct-outline', route: '/home' },
  ];

  constructor() {
    addIcons({
      chevronForwardOutline,
      bagHandleOutline,
      lockClosedOutline,
      locationOutline,
      cardOutline,
      notificationsOutline,
      constructOutline,
    });
  }

}
