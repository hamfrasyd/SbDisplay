import { OrderStatus } from '../../../generated/orders';

/**
 * The status an order should move to when advanced one step forward in its lifecycle.
 * @param currentStatus The order's current status.
 * @returns The next status (UnderPreparation -> ReadyForPickup -> Completed), or null when there is none.
 */
export function getNextOrderStatus(currentStatus: OrderStatus | undefined): OrderStatus | null {
    switch (currentStatus) {
        case OrderStatus.UnderPreparation:
            return OrderStatus.ReadyForPickup;
        case OrderStatus.ReadyForPickup:
            return OrderStatus.Completed;
        default:
            return null;
    }
}

/**
 * The status an order should move back to when reverted one step in its lifecycle.
 * @param currentStatus The order's current status.
 * @returns The previous status (Completed -> ReadyForPickup -> UnderPreparation), or null when there is none.
 */
export function getPreviousOrderStatus(currentStatus: OrderStatus | undefined): OrderStatus | null {
    switch (currentStatus) {
        case OrderStatus.Completed:
            return OrderStatus.ReadyForPickup;
        case OrderStatus.ReadyForPickup:
            return OrderStatus.UnderPreparation;
        default:
            return null;
    }
}
