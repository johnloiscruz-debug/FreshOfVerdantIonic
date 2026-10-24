import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

export const requireAccount: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestOnly: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated) return true;
  return inject(Router).parseUrl(auth.isAdmin ? '/admin' : '/home');
};

export const requireAdmin: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated) return router.createUrlTree(['/login']);
  return auth.isAdmin ? true : router.createUrlTree(['/home']);
};
