import { ChangeDetectorRef, Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
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

  // Samler alle subscriptions, så de kan stoppes samlet i ngOnDestroy.
  private sub: Subscription = new Subscription();

  // Bruges til at undgå, at SignalR startes under Server Side Rendering.
  private isBrowser: boolean;

  //constructor til at hente ordrer fra api'et og gemme dem i orders arrayet
  constructor(
    private signalRService: SignalRService,
    private orderService: OrdersService,
    private changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    // PLATFORM_ID fortæller om Angular-koden kører i browseren eller på serveren.
    // Det er relevant fordi projektet bruger SSR/hydration.
    // PLATFORM_ID har værdien: "browser" eller "server".
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ngOnInit til at hente ordrer når komponenten initialiseres
  ngOnInit(): void {
    this.loadOrders();

    // SignalR skal kun startes i browseren.
    // Under SSR findes der ikke en rigtig browserklient, som skal modtage live updates.
    if (!this.isBrowser) {
      return;
    }

    this.registerSignalRSubscriptions();
    this.signalRService.startConnection();
  }

  ngOnDestroy(): void {
    // Stopper alle subscriptions, så komponenten ikke fortsætter med at lytte efter den er væk.
    this.sub.unsubscribe();

    // Stopper kun SignalR hvis forbindelsen faktisk kunne være startet i browseren.
    // Fordi ngOnDestroy også kan køre under SSR, hvor SignalR ikke startes.
    // Det kan skabe fejl at prøve at stoppe en ikke-startet SignalR-forbindelse.
    if (this.isBrowser) {
      this.signalRService.stopConnection();
    }
  }

  private loadOrders(): void {
    // Henter det nuværende ordre-overblik fra API'et.
    this.orderService.getAllOrders().subscribe(orders => {
      this.orders = orders ?? [];
    });
  }

  private registerSignalRSubscriptions(): void {
    // Lytter efter nye ordrer fra SignalRService.
    this.sub.add(
      this.signalRService.newOrder$.subscribe(newOrder => {
        console.log('EmployeeDisplay received new order:', newOrder);
        this.addOrderToList(newOrder);
      })
    );

    // Lytter efter statusopdateringer fra SignalRService.
    this.sub.add(
      this.signalRService.updatedOrder$.subscribe(updatedOrder => {
        console.log('EmployeeDisplay received updated order:', updatedOrder);
        this.updateOrderStatusInList(updatedOrder);
      })
    );
  }

  private addOrderToList(newOrder: Order): void {
    // TransactionId bruges som unik nøgle for DOM, fordi OrderId'et kan potentielt gentage sig.
    const orderAlreadyExists = this.orders.some(order =>
      order.transactionId === newOrder.transactionId
    );

    if (orderAlreadyExists) {
      return;
    }

    // Opretter et nyt array, så Angular tydeligt kan se, at listen er ændret.
    // "..." betyder er "spread operator"
    this.orders = [...this.orders, newOrder];
  }

  private updateOrderStatusInList(updatedOrder: Order): void {
    // SignalR-opdateringen indeholder kun delvis ordredata.
    // Derfor opdateres kun status, så vi ikke overskriver fx items eller creationTime.
    this.orders = this.orders.map(order => {
      // Hvis det ikke er den opdaterede ordre, returneres den uændret.
      if (order.transactionId !== updatedOrder.transactionId) {
        return order;
      }

      return {
        // "..." betyder "spread operator" og laver en kopi af den eksisterende ordre.
        ...order,
        // Opdaterer kun status, så vi ikke overskriver fx items eller creationTime.
        status: updatedOrder.status
      };
    });

    // SignalR-opdateringen når frem til komponenten, men Angular opdaterer ikke altid viewet automatisk.
    // Derfor tvinger vi Angular til at tjekke template igen efter statusændringen.
    this.changeDetector.detectChanges();
  }
}
