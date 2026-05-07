import { Component, OnInit } from '@angular/core';
// importer api og orderklasse 
import { OrdersService, Order } from '../../generated/orders';
// importere form controls
import { FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';


@Component({
  selector: 'app-employee-display',
  imports: [ReactiveFormsModule],
  templateUrl: './employee-display.html',
  styleUrl: './employee-display.css',
})
export class EmployeeDisplay implements OnInit {

  //Opretter en tomt array til at holde ordrer
  public orders: Order[] = [];

//constructor til at hente ordrer fra api'et og gemme dem i orders arrayet
constructor(private order: OrdersService){}

// ngOnInit til at hente ordrer når komponenten initialiseres
  ngOnInit(): void {
    this.order.getAllOrders().subscribe(orders => {
    this.orders = orders;});
    };
}
