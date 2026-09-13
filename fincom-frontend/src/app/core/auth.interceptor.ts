import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { Auth } from '../auth';
import { API_BASE_URL } from './api-config';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  if (!req.url.startsWith(API_BASE_URL)) {
    return next(req);
  }

  const token = inject(Auth).getToken();
  if (!token) {
    return next(req);
  }

  const authorised = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(authorised);
};
