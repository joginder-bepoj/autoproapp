import { Component, OnInit } from '@angular/core';
import { IonHeader, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonIcon, CommonModule, RouterLink]
})
export class HeaderComponent implements OnInit {

  navItems = [
    { label: 'Home', route: '/home' },
    { label: 'Settings', route: '/home' },
    { label: 'Cart', route: '/home' },
    { label: 'History', route: '/home' },
    { label: 'Profile', route: '/login' },
  ];


  isMenuOpen = false;

  constructor() {
    addIcons({ searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }


  ngOnInit() { }

}
