import { Component, OnInit } from '@angular/core';
import { IonHeader, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { searchOutline, chevronBackOutline, chevronDownOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [IonHeader, IonIcon, CommonModule]
})
export class HeaderComponent implements OnInit {

  navItems = [
    { label: 'Home' },
    { label: 'Cart' },
    { label: 'Profile' },
    { label: 'Settings' },
    { label: 'History' },
  ];

  constructor() {
    addIcons({ searchOutline, chevronBackOutline, chevronDownOutline });
  }

  ngOnInit() { }

}
