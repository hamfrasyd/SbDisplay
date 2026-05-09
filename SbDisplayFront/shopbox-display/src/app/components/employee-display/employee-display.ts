import { ChangeDetectorRef, Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private isBrowser: boolean;

  //constructor til at hente ordrer fra api'et og gemme dem i orders arrayet
  constructor(private signalRService: SignalRService,
    private orderService: OrdersService,
    private changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ngOnInit til at hente ordrer når komponenten initialiseres
  ngOnInit(): void {
    this.loadOrders();

    if (!this.isBrowser) {
      return;
    }

    this.registerSignalRSubscriptions();
    this.signalRService.startConnection();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();

    if (this.isBrowser) {
      this.signalRService.stopConnection();
    }
  }
  
  private loadOrders(): void {
    this.orderService.getAllOrders().subscribe(orders => {
      this.orders = orders ?? [];
    });
  }

  private registerSignalRSubscriptions(): void {
    this.sub.add(
      this.signalRService.newOrder$.subscribe(newOrder => {
        console.log('EmployeeDisplay received new order:', newOrder);
        this.addOrderToList(newOrder);
      })
    );

    this.sub.add(
      this.signalRService.updatedOrder$.subscribe(updatedOrder => {
        console.log('EmployeeDisplay received updated order:', updatedOrder);
        this.updateOrderStatusInList(updatedOrder);
      })
    );
  }

  private addOrderToList(newOrder: Order): void {
    const orderAlreadyExists = this.orders.some(order =>
      order.transactionId === newOrder.transactionId
    );

    if (orderAlreadyExists) {
      return;
    }

    this.orders = [...this.orders, newOrder];
  }

  private updateOrderStatusInList(updatedOrder: Order): void {
    this.orders = this.orders.map(order => {
      if (order.transactionId !== updatedOrder.transactionId) {
        return order;
      }

      return {
        ...order,
        status: updatedOrder.status
      };
    });

    this.changeDetector.detectChanges();
  }
}
