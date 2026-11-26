export class DespesasNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Despesa não encontrada');
        this.name = 'DespesaNotFound';
    }
}

export class DespesasAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Despesa com este nome já existe');
        this.name = 'DespesaAlreadyExistsError';
    }
}

