import { Component, computed, signal } from '@angular/core';
import { OrderDisplayStateService } from '../../services/order-display-state.service';
import { Order, OrderStatus } from '../../generated/orders';

enum EmployeeTab {
  Received = 'Received',
  Completed = 'completed'
}

@Component({
    selector: 'app-employee-display',
    imports: [],
    templateUrl: './employee-display.html',
    styleUrl: './employee-display.css',
})
export class EmployeeDisplay {
    public readonly orderStatus = OrderStatus;
    public readonly employeeTab = EmployeeTab;

    public readonly activeTab = signal<EmployeeTab>(EmployeeTab.Received);
    public readonly cardErrors = signal<Map<number, string>>(new Map());
    public readonly pageError = signal<string | null>(null);

    public readonly receivedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.UnderPreparation || order.status === OrderStatus.ReadyForPickup);
    });

    public readonly completedOrders = computed(() => {
        return this.orderDisplayState.orders().filter(order => order.status === OrderStatus.Completed);
    });

    public readonly currentlyDisplayedOrders = computed(() => {
        if (this.activeTab() === EmployeeTab.Received) {
            return this.receivedOrders();
        }
        return this.completedOrders();
    });

    constructor(public orderDisplayState: OrderDisplayStateService) { }

    public setActiveTab(tab: EmployeeTab): void {
        this.activeTab.set(tab);
    }

    public clearPageError(): void {
        this.pageError.set(null);
    }

    public onCardClick(order: Order): void {
        if (order.status === OrderStatus.UnderPreparation) {
            this.setStatus(order, OrderStatus.ReadyForPickup);
            return;
        }

        if (order.status === OrderStatus.ReadyForPickup) {
            this.setStatus(order, OrderStatus.Completed);
            return;
        }
    }

    public onChangeStatus(order: Order, newStatus: OrderStatus): void {
        this.setStatus(order, newStatus);
    }

    private setStatus(order: Order, newStatus: OrderStatus): void {
        const transactionId = order.transactionId;

        if (transactionId === undefined || transactionId === null) {
            this.pageError.set('Kan ikke opdatere ordre uden transactionId.');
            return;
        }

        this.orderDisplayState.updateOrderStatus(transactionId, { status: newStatus }).subscribe({
            next: () => this.clearCardError(transactionId),
            error: () => this.setCardError(transactionId, 'Kunne ikke opdatere status. Pr�v igen.')
        });
    }

    private setCardError(transactionId: number, message: string): void {
        const next = new Map(this.cardErrors());
        next.set(transactionId, message);
        this.cardErrors.set(next);
    }

    private clearCardError(transactionId: number): void {
        const current = this.cardErrors();

        if (current.has(transactionId)) {
            const next = new Map(current);
            next.delete(transactionId);
            this.cardErrors.set(next);
        }
    }
}