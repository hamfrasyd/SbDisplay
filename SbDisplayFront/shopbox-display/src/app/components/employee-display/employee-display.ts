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
    // Initialiserer fælles ordre-state og live updates.
    // Selve SignalR- og liste-logikken ligger i OrderDisplayStateService, så den ikke gentages i flere komponenter.
    this.orderDisplayState.initialize();
  }
}
