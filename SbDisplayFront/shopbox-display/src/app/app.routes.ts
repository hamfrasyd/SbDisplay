import { Routes } from '@angular/router';
import { EmployeeDisplay } from './components/employee-display/employee-display';
import { LandingPage } from './components/landing-page/landing-page';
import { CustomerDisplay } from './components/customer-display/customer-display';

export const routes: Routes = [
    { path: '', component: LandingPage },
    { path: 'customer', component: CustomerDisplay },
    { path: 'employee', component: EmployeeDisplay }];
