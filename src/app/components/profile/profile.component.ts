import { FooterComponent } from 'src/app/shared/footer/footer.component';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonButton, IonInput, IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, syncOutline, phonePortraitOutline, trashOutline, addOutline, shieldCheckmarkOutline, starOutline, ribbonOutline, pieChartOutline, carOutline, pencilOutline, keyOutline, bulbOutline, chatboxEllipsesOutline, bagHandleOutline, cartOutline, clipboardOutline, medalOutline, carSportOutline, mailOutline, logOutOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { BreadcrumbsComponent } from '../../shared/breadcrumbs/breadcrumbs.component';
import { UtilService } from '../../services/util.service';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api-service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, IonButton, IonInput, IonContent, BreadcrumbsComponent, FooterComponent]
})
export class ProfileComponent implements OnInit {

  public userProfile: any;
  userSubscription?: Subscription;

  logins: any[] = [];
  activeDevices: any[] = [];
  userLoginsInfo: any = { count: 0, firstLogin: 0 };
  displayName = '';
  isUpdatingDisplayName = false;

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService
  ) {
    addIcons({ calendarOutline, syncOutline, phonePortraitOutline, trashOutline, addOutline, shieldCheckmarkOutline, starOutline, ribbonOutline, pieChartOutline, carOutline, pencilOutline, keyOutline, bulbOutline, chatboxEllipsesOutline, bagHandleOutline, cartOutline, clipboardOutline, medalOutline, carSportOutline, mailOutline, logOutOutline });
    this.userProfile = this.utilService.currentUser$;
  }

  userDetailsOptions = [
    {
      label: 'User Level',
      options: [
        {
          key: 'user_class',
          label: 'User Class',
          value: 'Gold',
          icon: 'medal-outline'
        },
        {
          key: 'user_score',
          label: 'User Score',
          value: '0',
          icon: 'star-outline'
        },
        {
          key: 'user_rank',
          label: 'User Rank',
          value: '0',
          icon: 'ribbon-outline'
        }
      ]
    },
    {
      label: 'User Contributions',
      options: []
    },
    {
      label: 'Order Activity',
      options: [
        {
          key: 'aks_orders',
          label: 'AKS Orders',
          value: '0',
          icon: 'cart-outline'
        },
        {
          key: 'total_orders',
          label: 'Total of All Orders',
          value: '0',
          icon: 'clipboard-outline'
        },
        {
          key: 'avg_order_amount',
          label: 'Average Order Amount',
          value: '0',
          icon: 'bag-handle-outline'
        }
      ]
    }
  ]

  contributionMetadata: any = {
    vehicle_images: { label: 'Vehicle Images', icon: 'car-outline' },
    corrections: { label: 'Corrections', icon: 'pencil-outline' },
    keymaking: { label: 'Keymaking', icon: 'key-outline' },
    tips_and_tricks: { label: 'Tips & Tricks', icon: 'bulb-outline' },
    ratings: { label: 'Ratings', icon: 'star-outline' },
    new_vehicles: { label: 'New Vehicles', icon: 'car-sport-outline' },
    feedbacks: { label: 'Feedbacks', icon: 'chatbox-ellipses-outline' }
  };

  ngOnInit() {
    this.userSubscription = this.utilService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.userProfile = user;
        this.displayName = this.getProfileDisplayName(user);
        this.apiService.getCustomerContributions(this.userProfile?.customerID).subscribe((data: any) => {
          console.log('Customer Contributions Raw Data:', data);
          if (data) {
            this.userDetailsOptions[1].options = Object.keys(data).map(key => ({
              key: key,
              label: this.contributionMetadata[key]?.label || key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              value: data[key],
              icon: this.contributionMetadata[key]?.icon || 'help-outline'
            }));
            console.log('Mapped Options:', this.userDetailsOptions[1].options);
          }
        });
        this.apiService.getDeviceLogins(this.userProfile?.customerID).subscribe((data: any) => {
          this.userLoginsInfo = data
        });
        this.apiService.loadDevices(this.userProfile?.customerID).subscribe((data: any) => {
          if (data) {
            this.activeDevices = Object.keys(data)
              .map(key => ({
                key: key,
                ...data[key]
              }))
              .filter(d => !d.removed);
          } else {
            this.activeDevices = [];
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  loadProfile() {
    this.utilService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.userProfile = user;
        this.displayName = this.getProfileDisplayName(user);
      } else {
        this.apiService.getCustomerProfile().subscribe((data: any) => {
          const profile = data?.data ?? data;
          this.userProfile = profile;
          this.displayName = this.getProfileDisplayName(profile);
          this.utilService.setUserProfile(profile);
        });
      }
    });

  }

  changePassword() {
    this.router.navigate(['/change-password']);
  }

  logout() {
    this.utilService.logout();
  }

  updateDisplayName() {
    const displayName = this.displayName.trim();
    if (!displayName) {
      this.utilService.showToast('Display name is required.', 'danger');
      return;
    }

    const nameParts = displayName.split(/\s+/);
    if (nameParts.length < 2) {
      this.utilService.showToast('Please input full name.', 'danger');
      return;
    }

    const firstName = nameParts[0];
    const lastName = displayName.substring(displayName.indexOf(' ') + 1).trim();

    this.isUpdatingDisplayName = true;
    this.utilService.showLoader();
    this.apiService.updateCustomerInfo({ firstName, lastName }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const result = (data?.result || data?.Result || '').toString().toLowerCase();
        if (result && result !== 'ok') {
          this.isUpdatingDisplayName = false;
          this.utilService.hideLoader();
          this.utilService.showToast(data?.message || 'Failed to update display name.', 'danger');
          return;
        }

        this.apiService.getCustomerProfile().subscribe({
          next: (profileRes: any) => {
            const profile = profileRes?.data ?? profileRes;
            if (profile) {
              this.userProfile = profile;
              this.displayName = this.getProfileDisplayName(profile);
              this.utilService.setUserProfile(profile);
            }
            this.isUpdatingDisplayName = false;
            this.utilService.hideLoader();
            this.utilService.showToast('Display name updated.', 'success');
          },
          error: () => {
            this.isUpdatingDisplayName = false;
            this.utilService.hideLoader();
            this.utilService.showToast('Display name updated.', 'success');
          }
        });
      },
      error: (err: any) => {
        this.isUpdatingDisplayName = false;
        this.utilService.hideLoader();
        const message = this.utilService.parseErrorMessage(err);
        this.utilService.showToast(message || 'Failed to update display name.', 'danger');
      }
    });
  }

  removeDevice(device: any) {
    if (!this.userProfile?.customerID || !device.key) return;

    this.utilService.showLoader();
    this.apiService.removeDeviceFirebase(this.userProfile.customerID, device.key).subscribe({
      next: () => {
        this.utilService.hideLoader();
        this.utilService.showToast('Device removed successfully', 'success');
      },
      error: (err) => {
        this.utilService.hideLoader();
        this.utilService.showToast('Failed to remove device', 'danger');
        console.error('Removal error:', err);
      }
    });
  }

  private getProfileDisplayName(profile: any): string {
    return (
      profile?.displayName ||
      profile?.userName ||
      `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()
    );
  }

}
