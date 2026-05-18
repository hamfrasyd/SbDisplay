import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { OrderStatus } from '../../generated/orders';

@Component({
  selector: 'app-employee-display',
  imports: [MatCardModule],
  templateUrl: './employee-display.html',
  styleUrl: './employee-display.css',
})
export class EmployeeDisplay {
  constructor(public orderDisplayState: OrderDisplayStateService) { }

  public markAsReadyForPickup(transactionId: number): void {
    this.orderDisplayState.updateOrderStatus(transactionId, { status: OrderStatus.ReadyForPickup });
  }

  public markAsUnderPreparation(transactionId: number): void {
    this.orderDisplayState.updateOrderStatus(transactionId, { status: OrderStatus.UnderPreparation });
  }

  public markAsCompleted(transactionId: number): void {
    this.orderDisplayState.updateOrderStatus(transactionId, { status: OrderStatus.Completed });
  }
}