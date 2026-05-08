import { ChangeDetectorRef, Component, OnInit} from '@angular/core';
// importer api og orderklasse 
import { OrdersService, Order } from '../../generated/orders';
// importere form controls
import { FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-employee-display',
  imports: [ReactiveFormsModule, MatCardModule],
  templateUrl: './employee-display.html',
  styleUrl: './employee-display.css',
})
export class EmployeeDisplay implements OnInit {

  //Opretter en tomt array til at holde ordrer
  public orders: Order[] = [];

//constructor til at hente ordrer fra api'et og gemme dem i orders arrayet
constructor(private orderService: OrdersService, private changeDetector: ChangeDetectorRef){}

// ngOnInit til at hente ordrer når komponenten initialiseres
  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe(orders => {
    this.orders = orders;});
    //this.changeDetector.detectChanges
    };
}
