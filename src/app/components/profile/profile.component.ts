import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, syncOutline, phonePortraitOutline, trashOutline, addOutline, shieldCheckmarkOutline, starOutline, ribbonOutline, pieChartOutline, carOutline, pencilOutline, keyOutline, bulbOutline, chatboxEllipsesOutline, bagHandleOutline, cartOutline, clipboardOutline, medalOutline, carSportOutline, mailOutline } from 'ionicons/icons';
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
  imports: [CommonModule, IonIcon, IonButton, IonInput, BreadcrumbsComponent]
})
export class ProfileComponent implements OnInit {

  public userProfile: any;
  userSubscription?: Subscription;

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService
  ) {
    addIcons({ calendarOutline, syncOutline, phonePortraitOutline, trashOutline, addOutline, shieldCheckmarkOutline, starOutline, ribbonOutline, pieChartOutline, carOutline, pencilOutline, keyOutline, bulbOutline, chatboxEllipsesOutline, bagHandleOutline, cartOutline, clipboardOutline, medalOutline, carSportOutline, mailOutline });
    this.userProfile = this.utilService.currentUser$;
  }

  userDetailsOptions = [
    {
      label: 'User Level',
      options: [
        {
          label: 'User Class',
          value: 'Gold',
          icon: 'medal-outline'
        },
        {
          label: 'User Score',
          value: '0',
          icon: 'star-outline'
        },
        {
          label: 'User Rank',
          value: '0',
          icon: 'ribbon-outline'
        }
      ]
    },
    {
      label: 'User Contributions',
      options: [
        {
          label: 'Vehicle Images',
          value: '0',
          icon: 'car-outline'
        },
        {
          label: 'Corrections',
          value: '0',
          icon: 'pencil-outline'
        },
        {
          label: 'Keymaking',
          value: '0',
          icon: 'key-outline'
        },
        {
          label: 'Tips & Tricks',
          value: '0',
          icon: 'bulb-outline'
        },
        {
          label: 'Ratings',
          value: '0',
          icon: 'star-outline'
        },
        {
          label: 'New Vehicles',
          value: '0',
          icon: 'car-sport-outline'
        },
        {
          label: 'Feedbacks',
          value: '0',
          icon: 'chatbox-ellipses-outline'
        }
      ]
    },
    {
      label: 'Order Activity',
      options: [
        {
          label: 'AKS Orders',
          value: '0',
          icon: 'cart-outline'
        },
        {
          label: 'Total of All Orders',
          value: '0',
          icon: 'clipboard-outline'
        },
        {
          label: 'Average Order Amount',
          value: '0',
          icon: 'bag-handle-outline'
        }
      ]
    }
  ]

  ngOnInit() {
    this.userSubscription = this.utilService.currentUser$.subscribe((user: any) => {
      this.userProfile = user;
      console.log(user, 'user')
      this.apiService.getCustomerContributions(this.userProfile?.customerID).subscribe((data: any) => {
        console.log('Customer Contributions', data);
      });
      this.apiService.getDeviceLogins(this.userProfile?.customerID).subscribe((data: any) => {
        console.log('Device Logins', data);
      });
    });
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  loadProfile() {
    this.utilService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.userProfile = user;
      } else {
        this.apiService.getCustomerProfile().subscribe((data: any) => {
          this.userProfile = data;
          this.utilService.setUserProfile(data);
        });
      }
    });

  }

  changePassword() {
    this.router.navigate(['/change-password']);
  }

}
