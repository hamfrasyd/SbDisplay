import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { OrderDisplayStateService } from '../../services/order-display-state.service';

@Component({
  selector: 'app-employee-display',
  imports: [ReactiveFormsModule, MatCardModule, AsyncPipe],
  templateUrl: './employee-display.html',
  styleUrl: './employee-display.css',
})
export class EmployeeDisplay implements OnInit {
  constructor(public orderDisplayState: OrderDisplayStateService) { }

  ngOnInit(): void {
  }

  public markAsReadyForPickup(transactionId: number): void {
    this.orderDisplayState.updateOrderStatus(transactionId, { status: 'ReadyForPickup' });
  }

  public markAsUnderPreparation(transactionId: number): void {
    this.orderDisplayState.updateOrderStatus(transactionId, { status: 'UnderPreparation' });
  }

  public markAsCompleted(transactionId: number): void {
    this.orderDisplayState.updateOrderStatus(transactionId, { status: 'Completed' });
  }
}
