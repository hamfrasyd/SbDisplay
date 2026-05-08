import { Component } from '@angular/core';

import { OrdersService, Order } from '../../generated/orders';

@Component({
  selector: 'app-customer-display',
  imports: [],
  templateUrl: './customer-display.html',
  styleUrl: './customer-display.css',
})
export class CustomerDisplay {

    //Opretter en tomt array til at holde ordrer
  public orders: Order[] = [];
}
