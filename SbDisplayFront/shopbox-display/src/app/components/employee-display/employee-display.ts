import { Component } from '@angular/core';
// importer api og orderklasse 
import { OrdersService, Order } from '../../generated/orders';

@Component({
  selector: 'app-employee-display',
  imports: [],
  templateUrl: './employee-display.html',
  styleUrl: './employee-display.css',
})
export class EmployeeDisplay {

  //Opretter en tomt array til at holde ordrer
  public orders: Order[] = [];

  
}
