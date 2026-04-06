import { Component, inject, OnInit } from '@angular/core';
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline, carOutline, logInOutline, addCircleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UtilService } from '../../services/util.service';
import { ApiService } from '../../services/api-service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, RouterLink]
})
export class HeaderComponent implements OnInit {

  navItems = [
    { label: 'Home', route: '/home' },
    { label: 'Settings', route: '/home' },
    { label: 'History', route: '/home' },
    { label: 'Cart', route: '/home' },
    { label: 'Login', route: '/login' },

  ];

  isMenuOpen = false;

  private utilService = inject(UtilService);
  private apiService = inject(ApiService);
  public userProfile$: Observable<any> = this.utilService.currentUser$;

  constructor() {
    addIcons({ searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline, carOutline, logInOutline, addCircleOutline });
  }

  ngOnInit(): void {
    const user = this.utilService.getUserProfile();
    console.log(user)
    if (this.utilService.isLoggedIn() && (!user || !user?.firstName)) {
      this.apiService.getCustomerProfile().subscribe(
        (profile: any) => {
          if (profile && profile?.data) {
            this.utilService.setUserProfile(profile.data);
          }
        },
        (err) => {
          console.error('Initial login sync failed:', err);
        }
      );
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.utilService.logout();
  }

}
