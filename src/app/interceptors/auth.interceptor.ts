import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { UtilService } from '../services/util.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const utilService = inject(UtilService);

  const methodSend = req.method;
  const isChangeRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(methodSend);
  const token = utilService.getPrivateKey();

  // Extract API path
  const targetPath = req.url.split('/V1/').pop() || '';

  let modifiedReq = req;

  // if (token) {
  // ✅ Admin Authentication
  const headers = utilService.constructAPIHeaders(methodSend, targetPath);

  modifiedReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': headers.Authorization,
      'Time': headers.Time,
      'Key': headers.Key,
      'apiKeyPublic': headers.apiKeyPublic,
      'apiKeySecret': headers.apiKeySecret
    }
  });

  alert(JSON.stringify(window.location.origin));
  alert(JSON.stringify(window.location.host));
  // } else if (isChangeRequest) {
  //   // ✅ Catalogue Authentication
  //   const headers = utilService.constructCatalogueHeaders(methodSend, targetPath);

  //   modifiedReq = req.clone({
  //     setHeaders: {
  //       'Content-Type': 'application/json',
  //       Authorization: headers.Authorization,
  //       Time: headers.Time,
  //       Key: headers.Key,
  //       apiKeyPublic: headers.apiKeyPublic,
  //       apiKeySecret: headers.apiKeySecret
  //     }
  //   });
  // }

  return next(modifiedReq).pipe(handleResponses(utilService));
};


// ✅ Response + Error Handler
function handleResponses(utilService: any) {
  return (source: any) =>
    source.pipe(
      map((event: any) => {
        if (event instanceof HttpResponse) {
          const body = event.body as any;

          // 🔐 Handle API auth failure inside 200 response
          if (
            body &&
            (
              body.code === '5' ||
              body.message === 'Failed to Authenticate.' ||
              (body.errors && body.errors.code === '5')
            )
          ) {
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