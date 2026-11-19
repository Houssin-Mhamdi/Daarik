import { Injectable } from "@nestjs/common";
import { Observable, Subscriber } from "rxjs";

export interface CookOrderNotification {
  orderId: string;
  code: string;
  status: string;
  totalCents: number;
  createdAt: string;
}

const KEEP_ALIVE_MS = 15_000;

/**
 * In-memory, per-cook stream of live events.
 *
 * Nothing sensitive is stored: only the open subscribers and the small event
 * payload needed to show "new order" in the cook dashboard. Customer contact
 * details and addresses are deliberately never included.
 */
@Injectable()
export class NotificationsService {
  private readonly streams = new Map<string, Set<Subscriber<MessageEvent>>>();

  subscribe(cookId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let listeners = this.streams.get(cookId);
      if (!listeners) {
        listeners = new Set<Subscriber<MessageEvent>>();
        this.streams.set(cookId, listeners);
      }
      listeners.add(subscriber);

      subscriber.next({
        type: "connected",
        data: { at: new Date().toISOString() },
      } as unknown as MessageEvent);

      // proxies and browsers close idle connections; a small event keeps it open.
      const keepAlive = setInterval(() => {
        subscriber.next({
          type: "ping",
          data: { at: new Date().toISOString() },
        } as unknown as MessageEvent);
      }, KEEP_ALIVE_MS);

      return () => {
        clearInterval(keepAlive);
        listeners?.delete(subscriber);
        if (listeners?.size === 0) this.streams.delete(cookId);
      };
    });
  }

  notifyNewOrder(cookId: string, order: CookOrderNotification): void {
    this.emit(cookId, {
      id: order.orderId,
      type: "order.new",
      retry: 5_000,
      data: order,
    } as unknown as MessageEvent);
  }

  private emit(cookId: string, event: MessageEvent): void {
    this.streams.get(cookId)?.forEach((subscriber) => subscriber.next(event));
  }
}
