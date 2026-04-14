import { Component, ViewChild } from '@angular/core';
import { IonApp, IonContent } from '@ionic/angular/standalone';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { UtilService } from './services/util.service';
import { ApiService } from './services/api-service';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp,
    RouterOutlet,
    HeaderComponent,
    IonContent,
    FooterComponent,
    AsyncPipe
  ],
})
export class AppComponent {

  showAppComponents: boolean = true;
  isHomePage: boolean = false;

  loading$ = this.utilService.isLoading$;

  @ViewChild(IonContent, { static: false }) content!: IonContent;

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {

        const url = event.urlAfterRedirects || event.url;
        this.isHomePage =
          url === '/home' || url.startsWith('/home?');

        this.showAppComponents =
          !url.includes('/login') &&
          !url.includes('/register');
        console.log('i am here');
        this.scrollToTop();
        this.cdr.detectChanges();
      });
  }

  ngOnInit() {
    this.initializeApp();
  }

  private async initializeApp() {
    const startTime = Date.now();
    const minDisplayTime = 2000; // Minimum splash display time in ms
    const privateKey = this.utilService.getPrivateKey();

    App.addListener('backButton', ({ canGoBack }) => {
      if (this.isHomePage || !this.showAppComponents) {
        App.exitApp();
      } else {
        this.location.back();
      }
    });

    const finishInitialization = async () => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      // Wait for the remaining minimum time + a small buffer for rendering
      setTimeout(() => {
        this.hideSplashScreen();
      }, remainingTime + 300);
    };

    if (privateKey) {
      // Sync profile and cart
      let syncsCompleted = 0;
      const totalSyncs = 2;

      const onSyncComplete = () => {
        syncsCompleted++;
        if (syncsCompleted >= totalSyncs) {
          finishInitialization();
        }
      };

      this.apiService.getCustomerProfile().subscribe({
        next: (profile: any) => {
          if (profile?.data) {
            this.utilService.setUserProfile(profile.data);
          }
          onSyncComplete();
        },
        error: (err) => {
          console.error('Initial profile sync failed:', err);
          onSyncComplete();
        }
      });

      this.apiService.getCartItems().subscribe({
        next: (cart: any) => {
          if (cart?.data) {
            this.utilService.setCart(cart.data);
          }
          onSyncComplete();
        },
        error: (err) => {
          console.error('Initial cart sync failed:', err);
          onSyncComplete();
        }
      });

      // Safety fallback: hide after 6 seconds even if sync fails
      setTimeout(() => finishInitialization(), 6000);
    } else {
      finishInitialization();
    }
  }

  private hideSplashScreen() {
    SplashScreen.hide().catch(err => {
      console.warn('SplashScreen hide failed (likely running in browser):', err);
    });
  }

  private scrollToTop() {
    setTimeout(() => {
      this.content?.scrollToTop(0);
    }, 50);
  }
}