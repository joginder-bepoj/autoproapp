import { Component, ViewChild, OnInit } from '@angular/core';
import { IonApp, IonContent } from '@ionic/angular/standalone';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { UtilService } from './services/util.service';
import { ApiService } from './services/api-service';
import { AsyncPipe } from '@angular/common';
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
export class AppComponent implements OnInit {

  showAppComponents: boolean = true;
  isHomePage: boolean = false;

  loading$ = this.utilService.isLoading$;

  @ViewChild(IonContent, { static: false }) content!: IonContent;

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService,
    private location: Location
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
        this.scrollToTop();
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

      this.apiService.getEzPages().subscribe({
        next: (res: any) => {
          if (res) {
            console.log(res, 'res data');
            this.utilService.setEzPages(res);
          }
        },
        error: (err) => console.error('Ez Pages error:', err)
      });
    }
  }

  private scrollToTop() {
    setTimeout(() => {
      this.content?.scrollToTop(0);
    }, 50);
  }
}