import { Routes } from '@angular/router';
import { CustomerDisplay } from './components/customer-display/customer-display';
import { EmployeeDisplay } from './components/employee-display/employee-display';
import { LandingPage } from './components/landing-page/landing-page'

export const routes: Routes = [
    { path: '', component: LandingPage},
    { path: 'customer', component: CustomerDisplay}, 
    { path: 'employee', component: EmployeeDisplay }];

