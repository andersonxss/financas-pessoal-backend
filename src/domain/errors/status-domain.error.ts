export class StatusNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Status não encontrado');
        this.name = 'StatusNotFound';
    }
}

export class StatusAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Status com este nome já existe');
        this.name = 'StatusAlreadyExistsError';
    }
}

