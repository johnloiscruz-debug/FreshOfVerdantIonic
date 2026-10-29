import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (typeof localStorage === 'undefined' || !request.url.startsWith(environment.apiBaseUrl)) {
    return next(request);
  }

  const token = localStorage.getItem('fv-auth-access-token');
  if (!token) return next(request);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
