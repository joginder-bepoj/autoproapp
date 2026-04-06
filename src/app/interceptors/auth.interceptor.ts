import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, map, switchMap, throwError } from 'rxjs';
import { UtilService } from '../services/util.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const utilService = inject(UtilService);
  const token = utilService.getPrivateKey();

  if (token) {
    const methodSend = req.method;
    const targetPath = req.url.split('/V1/').pop() || '';

    return from(utilService.constructAPIHeaders(methodSend, targetPath)).pipe(
      switchMap(headers => {
        const authReq = req.clone({
          headers: req.headers
            .set('Content-Type', 'application/json')
            .set('Authorization', headers.Authorization)
            .set('Time', headers.Time)
            .set('Key', headers.Key)
            .set('apiKeyPublic', headers.apiKeyPublic)
            .set('apiKeySecret', headers.apiKeySecret)
        });

        return next(authReq);
      }),
      map(event => {
        if (event instanceof HttpResponse) {
          const body = event.body as any;
          // Handle API that returns 200 OK but with an error code for auth failure
          if (body && (body.code === '5' || body.message === 'Failed to Authenticate.' || (body.errors && body.errors.code === '5'))) {
            console.warn('API returned 200 but Auth failed - Logging out');
            utilService.logout();
            throw new HttpErrorResponse({
              status: 401,
              statusText: 'Unauthorized',
              error: body
            });
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Global logout on 401 Unauthorized
          console.warn('Session expired - Logging out');
          utilService.logout();
        }
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        const body = event.body as any;
        // Handle API that returns 200 OK but with an error code for auth failure
        if (body && (body.code === '5' || body.message === 'Failed to Authenticate.' || (body.errors && body.errors.code === '5'))) {
          console.warn('API returned 200 (No Token) but Auth failed - Logging out');
          utilService.logout();
          throw new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: body
          });
        }
      }
      return event;
    }),
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Global logout on 401 Unauthorized
        console.warn('Session expired (No Token) - Logging out');
        utilService.logout();
      }
      return throwError(() => error);
    })
  );
};
