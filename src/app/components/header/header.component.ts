import { Component, inject, OnInit } from '@angular/core';
import { IonIcon, IonBadge } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline, carOutline, logInOutline, addCircleOutline, } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UtilService } from '../../services/util.service';
import { ApiService } from '../../services/api-service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonBadge, IonIcon, CommonModule, RouterLink]
})
export class HeaderComponent implements OnInit {

  navItems = [
    { label: 'Home', route: '/home' },
    { label: 'Settings', route: '/home' },
    { label: 'History', route: '/home' },
    { label: 'Cart', route: '/cart' },
    { label: 'Login', route: '/login' },

  ];

  isMenuOpen = false;
  cartQty = 0;
  cartSubscription: Subscription | undefined;

  private utilService = inject(UtilService);
  // private apiService = inject(ApiService);
  public userProfile$: Observable<any> = this.utilService.currentUser$;

  constructor() {
    addIcons({ searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline, carOutline, logInOutline, addCircleOutline });
  }

  ngOnInit(): void {
    this.cartSubscription = this.utilService.cart$.subscribe((cart) => {
      if (cart) {
        this.cartQty = cart.cartQty;
      } else {
        this.cartQty = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.cartSubscription?.unsubscribe();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.utilService.logout();
  }


}
