import { Component, HostListener, OnInit, inject } from '@angular/core';
import { IonHeader, IonIcon, IonContent } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline, carOutline, logInOutline, addCircleOutline } from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  isScrolled = false;
  isHomePage = true;

  private router = inject(Router);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isHomePage) {
      this.isScrolled = true;
    } else {
      this.isScrolled = window.scrollY > 20;
    }
  }

  @HostListener('document:ionScroll', ['$event'])
  onIonScroll(event: any) {
    if (!this.isHomePage) {
      this.isScrolled = true;
    } else {
      this.isScrolled = event.detail.scrollTop > 20;
    }
  }


  constructor() {
    addIcons({ searchOutline, chevronBackOutline, chevronDownOutline, notificationsOutline, personCircleOutline, menuOutline, closeOutline, carOutline, logInOutline, addCircleOutline });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }


  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRoute(event.urlAfterRedirects || event.url);
    });

    // Initial check
    this.checkRoute(this.router.url);
  }

  private checkRoute(url: string) {
    this.isHomePage = url === '/home' || url.startsWith('/home?');
    // If not home page, we want it to look "scrolled" (solid) by default
    if (!this.isHomePage) {
      this.isScrolled = true;
    } else {
      // Re-run scroll check for home page
      this.onWindowScroll();
    }
  }

}
