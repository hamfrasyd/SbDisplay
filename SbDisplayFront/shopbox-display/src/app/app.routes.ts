import { Routes } from '@angular/router';
import { CustomerDisplay } from './components/customer-display/customer-display';
import { EmployeeDisplay } from './components/employee-display/employee-display';

export const routes: Routes = [{ path: 'customerdisplay', component: CustomerDisplay }, { path: 'employee', component: EmployeeDisplay }];
