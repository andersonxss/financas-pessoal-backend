export class ParcelasNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Parcela não encontrado');
        this.name = 'ParcelasNotFound';
    }
}

export class ParcelasAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Parcela com este nome já existe');
        this.name = 'ParcelasAlreadyExistsError';
    }
}

