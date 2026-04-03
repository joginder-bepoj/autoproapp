import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, syncOutline, phonePortraitOutline, trashOutline, addOutline, shieldCheckmarkOutline, starOutline, ribbonOutline, pieChartOutline, carOutline, pencilOutline, keyOutline, bulbOutline, chatboxEllipsesOutline, bagHandleOutline, cartOutline, clipboardOutline, medalOutline, carSportOutline } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton, IonInput]
})
export class ProfileComponent implements OnInit {

  constructor(private router: Router) {
    addIcons({ calendarOutline, syncOutline, phonePortraitOutline, trashOutline, addOutline, shieldCheckmarkOutline, starOutline, ribbonOutline, pieChartOutline, carOutline, pencilOutline, keyOutline, bulbOutline, chatboxEllipsesOutline, bagHandleOutline, cartOutline, clipboardOutline, medalOutline, carSportOutline });
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

  ngOnInit() { }

  changePassword() {
    this.router.navigate(['/change-password']);
  }

}
