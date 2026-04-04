import { Component } from '@angular/core';
import { IonApp, IonContent } from '@ionic/angular/standalone';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, RouterOutlet, HeaderComponent, IonContent, FooterComponent],
})
export class AppComponent {
  showAppComponents: boolean = true;
  isHomePage: boolean = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      this.isHomePage = url === '/home' || url.startsWith('/home?');
      
      if (this.showAppComponents) {
        this.showAppComponents = !url.includes('/login') && !url.includes('/register');
      } else {
        setTimeout(() => {
          this.showAppComponents = !url.includes('/login') && !url.includes('/register');
        }, 150);
      }
    });
  }
}
