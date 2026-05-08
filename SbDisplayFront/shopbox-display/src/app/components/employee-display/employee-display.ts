import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
// importer api og orderklasse 
import { OrdersService, Order } from '../../generated/orders';
// importere form controls
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { SignalRService } from '../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-display',
  imports: [ReactiveFormsModule, MatCardModule],
  templateUrl: './employee-display.html',
  styleUrl: './employee-display.css',
})
export class EmployeeDisplay implements OnInit, OnDestroy {

  //Opretter en tomt array til at holde ordrer
  public orders: Order[] = [];
  private sub: Subscription = new Subscription();

//constructor til at hente ordrer fra api'et og gemme dem i orders arrayet
    constructor(private signalRService: SignalRService, private orderService: OrdersService, private changeDetector: ChangeDetectorRef){}

  // ngOnInit til at hente ordrer når komponenten initialiseres
  ngOnInit(): void {
    this.signalRService.startConnection();

    this.order.getAllOrders().subscribe(orders => {
      this.orders = orders;
    });


    // Subscribes to new order notifications from SignalR and updates the orders list accordingly
    this.sub.add(this.signalRService.newOrder$.subscribe(newOrder => {
      this.orders.push(newOrder);
      this.changeDetector.detectChanges(); // Opdaterer visningen
    }));

    // Subscribes to order updates from SignalR and updates the corresponding order in the list
    this.sub.add(
      this.signalRService.updatedOrder$.subscribe(order => this.updateOrderInList(order))
    );
  }

  // ngOnDestroy til at frigive ressourcer når komponenten deinitialiseres
  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.signalRService.stopConnection();
  }

  private updateOrderInList(updatedOrder: Order): void {
    const index = this.orders.findIndex(order => order.id === updatedOrder.id);

    if (index === -1) { // Hvis ordren ikke findes i listen, gør intet
      return;
    }

    this.orders[index] = updatedOrder; // Opdater ordren i listen
    this.changeDetector.detectChanges(); // Opdaterer visningen
  }
}
