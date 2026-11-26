export abstract class DomainEvent {
    readonly occurredAt: Date = new Date();
    readonly event: string;
    abstract eventName(): string;
}
