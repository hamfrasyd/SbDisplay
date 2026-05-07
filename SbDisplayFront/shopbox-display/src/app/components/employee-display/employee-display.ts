import { Component } from '@angular/core';
// importer api og orderklasse 
import { OrdersService, Order } from '../../generated/orders';
// importere form controls
import { FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-employee-display',
  imports: [],
  templateUrl: './employee-display.html',
  styleUrl: './employee-display.css',
})
export class EmployeeDisplay {

  //Opretter en tomt array til at holde ordrer
  public orders: Order[] = [];

  // Opretter en form group
  form: FormGroup = new FormGroup({
    orderId: new FormControl<number | null>(null)



  })

//constructor til at hente ordrer fra api'et og gemme dem i orders arrayet
constructor(private order: OrdersService){}

// ngOnInit til at hente ordrer når komponenten initialiseres
  ngOnInit(): void {
    this.order.getAllOrders().subscribe(orders => {
      this.orders = orders;});
    };
  }
