export class SendMessageCommand {
    constructor(
        public readonly userId: string,
        public readonly message: string,
    ) { }
}