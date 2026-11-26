export class CreateCategoriaCommand {
    constructor(
        public readonly name: string,
        public readonly status_id: string,
    ) { }
}