import { Component, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { OrderDisplayStateService } from '../../services/order-display-state.service';

@Component({
  selector: 'app-customer-display',
  imports: [AsyncPipe],
  templateUrl: './customer-display.html',
  styleUrl: './customer-display.css',
})
export class CustomerDisplay implements OnInit {
  constructor(public orderDisplayState: OrderDisplayStateService) { }

  ngOnInit(): void {
    // Bruger samme fælles ordre-state som medarbejderdisplayet.
    // Derfor får kundedisplayet også live statusændringer uden at duplikerer SignalR-kode.
    this.orderDisplayState.initialize();
  }
}
