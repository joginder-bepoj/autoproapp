import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, HeaderComponent],
})
export class AppComponent {
  showAppComponents: boolean = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
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
