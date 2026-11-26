export class Pagamentos {
    constructor(
        public readonly id: string,
        public name: string,
        public status_id: string,
        public createdAt?: Date,
        public updatedAt?: Date
    ) { }
}