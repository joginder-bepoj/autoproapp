import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { inject, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { finalize } from 'rxjs';
import { UtilService } from './app/services/util.service';
import { IonicStorageModule } from '@ionic/storage-angular';

export function initializeApp(utilService: UtilService) {
  return () => utilService.initStorage();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(IonicStorageModule.forRoot({
      name: '__mydb'
    })),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [UtilService],
      multi: true
    },
    provideHttpClient(withInterceptors([
      authInterceptor,
      (req, next) => {
        const utilService = inject(UtilService);
        utilService.showLoader();
        return next(req).pipe(finalize(() => utilService.hideLoader()));
      }
    ])),
  ],
});