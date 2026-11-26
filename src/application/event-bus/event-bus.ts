import { DomainEvent } from "@events";

export interface EventBus {
    publish(event: DomainEvent): Promise<void>;
    consume(event: DomainEvent): Promise<void>;
}
