export class PagamentosNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Pagamentos não encontrado');
        this.name = 'PagamentosNotFound';
    }
}

export class PagamentosAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Pagamentos com este nome já existe');
        this.name = 'PagamentosAlreadyExistsError';
    }
}

