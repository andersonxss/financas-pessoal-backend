export class CreateAuthCommand {
    constructor(
        public readonly email: string,
        public readonly password: string,
    ) { }
}