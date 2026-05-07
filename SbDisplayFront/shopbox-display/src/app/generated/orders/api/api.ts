export * from './orders.service';
import { OrdersService } from './orders.service';
export * from './webHooks.service';
import { WebHooksService } from './webHooks.service';
export const APIS = [OrdersService, WebHooksService];
