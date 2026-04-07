import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, map, switchMap, throwError } from 'rxjs';
import { UtilService } from '../services/util.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const utilService = inject(UtilService);
  const token = utilService.getPrivateKey();
  const methodSend = req.method;
  const isChangeRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(methodSend);

  // Extract the target path/URI for the auth message
  const targetPath = req.url.split('/V1/').pop() || '';

  if (token) {
    // Standard Admin Authentication
    return from(utilService.constructAPIHeaders(methodSend, targetPath)).pipe(
      switchMap(headers => {
        const authReq = req.clone({
          headers: req.headers
            .set('Content-Type', 'application/json')
            .set('Authorization', headers.Authorization)
            .set('Time', headers.Time)
            .set('Key', headers.Key)
          // .set('apiKeyPublic', headers.apiKeyPublic)
          // .set('apiKeySecret', headers.apiKeySecret)
        });
        return next(authReq);
      }),
      handleResponses(utilService)
    );
  } else if (isChangeRequest) {
    // Catalogue Authentication for change-causing requests (POST, etc.) when no admin token is present
    return from(utilService.constructCatalogueHeaders(methodSend, targetPath)).pipe(
      switchMap(headers => {
        const authReq = req.clone({
          headers: req.headers
            .set('Content-Type', 'application/json')
            .set('Authorization', headers.Authorization)
            .set('Time', headers.Time)
            .set('Key', headers.Key)
        });
        return next(authReq);
      }),
      handleResponses(utilService)
    );
  }

  return next(req).pipe(handleResponses(utilService));
};

/**
 * Shared logic to handle common API responses and error codes
 */
function handleResponses(utilService: any) {
  return (source: any) => source.pipe(
    map((event: any) => {
      if (event instanceof HttpResponse) {
        const body = event.body as any;
        // Handle API that returns 200 OK but with an error code for auth failure (code '5' or specific message)
        if (body && (body.code === '5' || body.message === 'Failed to Authenticate.' || (body.errors && body.errors.code === '5'))) {
          console.warn('API returned Auth failure - Logging out');
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
        console.warn('Session expired or Unauthorized - Logging out');
        utilService.logout();
      }
      return throwError(() => error);
    })
  );
}
