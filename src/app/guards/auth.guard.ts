import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { UtilService } from '../services/util.service';

/**
 * Guard to protect routes from unauthorized access.
 * Checks if the user is fully logged in (has private key + profile data).
 */
export const authGuard: CanActivateFn = (route, state) => {
  // return true
  const utilService = inject(UtilService);
  const router = inject(Router);

  if (utilService.isLoggedIn()) {
    return true;
  }

  // Redirect to login page if NOT authenticated
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

