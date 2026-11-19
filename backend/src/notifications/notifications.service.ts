import { Injectable, Logger } from "@nestjs/common";
import { Observable, Subscriber } from "rxjs";
import { WebPushService } from "./web-push.service";

export interface CookOrderNotification {
  orderId: string;
  code: string;
  status: string;
  totalCents: number;
  createdAt: string;
}

const KEEP_ALIVE_MS = 15_000;

/**
 * In-memory, per-cook stream of live events, plus best-effort Web Push for
 * cooks who are not looking at the dashboard.
 *
 * Nothing sensitive is stored or sent: only an order code/status/total.
 * Customer contact details and addresses are deliberately never included.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly streams = new Map<string, Set<Subscriber<MessageEvent>>>();

  constructor(private readonly webPush: WebPushService) {}

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

      // Proxies and browsers close idle connections; a small event keeps it open.
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

  /**
   * @param cookId   CookProfile id — selects the SSE room.
   * @param userId   owning User id — selects Web Push subscriptions.
   */
  notifyNewOrder(
    cookId: string,
    userId: string,
    order: CookOrderNotification,
  ): void {
    this.emit(cookId, {
      id: order.orderId,
      type: "order.new",
      retry: 5_000,
      data: order,
    } as unknown as MessageEvent);

    // OS-level notification for closed tabs. Fire-and-forget by design: a push
    // failure must never affect an already-paid order.
    if (this.webPush.isEnabled()) {
      void this.webPush
        .sendToUser(userId, {
          orderId: order.orderId,
          code: order.code,
          url: "/cook/orders",
        })
        .catch((error) => {
          this.logger.warn(`Web Push dispatch failed: ${String(error)}`);
        });
    }
  }

  private emit(cookId: string, event: MessageEvent): void {
    this.streams.get(cookId)?.forEach((subscriber) => subscriber.next(event));
  }
}
