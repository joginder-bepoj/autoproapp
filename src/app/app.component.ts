import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/header/header.component';
import { UtilService } from './services/util.service';
import { ApiService } from './services/api-service';
import { AsyncPipe } from '@angular/common';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Location } from '@angular/common';
import { ToastController } from '@ionic/angular/standalone';
import { CustomToastComponent } from './shared/custom-toast/custom-toast.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonRouterOutlet,
    IonApp,
    HeaderComponent,
    AsyncPipe,
    CustomToastComponent
  ],
})
export class AppComponent implements OnInit {

  showAppComponents: boolean = true;
  isHomePage: boolean = false;

  loading$ = this.utilService.isLoading$;

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService,
    private location: Location,
    public toastController: ToastController,
  ) {
    this.loadSplashScreen();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {

        const url = event.urlAfterRedirects || event.url;

        this.isHomePage =
          url === '/home' || url.startsWith('/home?');

        this.showAppComponents =
          !url.includes('/login') &&
          !url.includes('/register');
      });
  }

  ngOnInit() {
    this.loadInitialData();
  }


  async loadSplashScreen() {
    await SplashScreen.show({
      showDuration: 3000,
      autoHide: true,
    });
  }

  loadInitialData() {

    App.addListener('backButton', ({ canGoBack }) => {
      if (this.isHomePage || !this.showAppComponents) {
        App.exitApp();
      } else {
        this.location.back();
      }
    });

    App.addListener('appUrlOpen', (event) => {
      this.handleAppUrlOpen(event.url);
    });

    const privateKey = this.utilService.getPrivateKey();
    if (!privateKey) return;

    // Get Profile
    let user = this.utilService.getUserProfile();
    if (user) {
      this.utilService.setUserProfile(user);
    } else {
      this.apiService.getCustomerProfile().subscribe({
        next: (res: any) => {
          if (res?.data) {
            this.utilService.setUserProfile(res.data);
          }
        },
        error: (err) => console.error('Profile error:', err)
      });

      // Get Cart
      this.apiService.getCartItems().subscribe({
        next: (res: any) => {
          if (res?.data) {
            this.utilService.setCart(res.data);
          }
        },
        error: (err) => console.error('Cart error:', err)
      });

    }
  }

  private handleAppUrlOpen(url: string) {
    try {
      const openedUrl = new URL(url);
      const payerID =
        openedUrl.searchParams.get('payerID') ||
        openedUrl.searchParams.get('PayerID') ||
        openedUrl.searchParams.get('payerId');
      const paymentID =
        openedUrl.searchParams.get('paymentID') ||
        openedUrl.searchParams.get('paymentId') ||
        openedUrl.searchParams.get('payment_id');

      if (payerID && paymentID) {
        this.router.navigate(['/checkout'], {
          queryParams: { payerID, paymentID },
        });
        return;
      }

      if (openedUrl.pathname) {
        this.router.navigateByUrl(openedUrl.pathname + openedUrl.search);
      }
    } catch (error) {
      console.error('App URL open error:', error);
    }
  }

}
