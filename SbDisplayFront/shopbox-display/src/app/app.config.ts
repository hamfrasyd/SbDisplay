import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { environment } from '../environments/environment.development';
import { BASE_PATH } from './generated/orders';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    // BASE_PATH bruges af den genererede OpenAPI-client som base URL for alle API-kald.
    // Værdien hentes fra environment.apiUrl, så URL'en kan ændres mellem development og production
    { provide: BASE_PATH, useValue: environment.apiUrl }
  ]
};
