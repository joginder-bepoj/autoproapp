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
    private cdr: ChangeDetectorRef
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
    const privateKey = this.utilService.getPrivateKey();

    if (privateKey) {

      this.apiService.getCustomerProfile().subscribe(
        (profile: any) => {
          if (profile?.data) {
            this.utilService.setUserProfile(profile.data);
          }
        },
        (err) => {
          console.error('Initial login sync failed:', err);
        }
      );

      this.apiService.getCartItems().subscribe(
        (cart: any) => {
          if (cart?.data) {
            this.utilService.setCart(cart.data);
          }
        },
        (err) => {
          console.error('Initial login sync failed:', err);
        }
      );
    }
  }

  private scrollToTop() {
    setTimeout(() => {
      this.content?.scrollToTop(0);
    }, 50);
  }
}