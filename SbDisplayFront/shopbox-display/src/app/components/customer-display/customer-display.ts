import { Component } from '@angular/core';
import { OrderDisplayStateService } from '../../services/order-display-state.service';

@Component({
  selector: 'app-customer-display',
  imports: [],
  templateUrl: './customer-display.html',
  styleUrl: './customer-display.css',
})
export class CustomerDisplay {
  constructor(public orderDisplayState: OrderDisplayStateService) { }
}