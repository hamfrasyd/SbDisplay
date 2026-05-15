import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { BASE_PATH } from './generated/orders';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    // BASE_PATH bruges af den genererede OpenAPI-client som base URL for alle API-kald.
    // Værdien hentes fra environment.apiUrl, så URL'en kan ændres mellem development og production
    { provide: BASE_PATH, useValue: environment.apiUrl }
  ]
};