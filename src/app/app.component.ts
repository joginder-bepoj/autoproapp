import { Component } from '@angular/core';
import { IonApp, IonContent } from '@ionic/angular/standalone';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { UtilService } from './services/util.service';
import { ApiService } from './services/api-service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, RouterOutlet, HeaderComponent, IonContent, FooterComponent, AsyncPipe],
})
export class AppComponent {
  showAppComponents: boolean = true;
  isHomePage: boolean = false;
  loading$ = this.utilService.isLoading$;

  constructor(
    private router: Router,
    private utilService: UtilService,
    private apiService: ApiService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.isHomePage = url === '/home' || url.startsWith('/home?');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      if (this.showAppComponents) {
        this.showAppComponents = !url.includes('/login') && !url.includes('/register');
      } else {
        setTimeout(() => {
          this.showAppComponents = !url.includes('/login') && !url.includes('/register');
        }, 150);
      }
    });
  }

  ngOnInit() {
    let privateKey = this.utilService.getPrivateKey();

    if (privateKey) {
      this.apiService.getCustomerProfile().subscribe(
        (profile: any) => {
          if (profile && profile?.data) {
            this.utilService.setUserProfile(profile.data);
          }
        },
        (err) => {
          console.error('Initial login sync failed:', err);
        }
      );

      this.apiService.getCartItems().subscribe(
        (cart: any) => {
          if (cart && cart?.data) {
            this.utilService.setCart(cart.data);
          }
        },
        (err) => {
          console.error('Initial login sync failed:', err);
        }
      );
    }

    // this.apiService.getVehicleInfo('19').subscribe((res: any) => {
    //   console.log(res);
    // })

    // this.apiService.getVehicleYearList(182).subscribe((res: any) => {
    //   console.log(res);
    // })

    // this.apiService.getVehicleProductList(183).subscribe((res: any) => {
    //   console.log(res);
    // })

    // this.apiService.getVehicleCategoryList().subscribe((res: any) => {
    //   console.log(res);
    // })

  }
}
