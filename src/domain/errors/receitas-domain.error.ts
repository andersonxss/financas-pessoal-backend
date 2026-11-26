export class ReceitasNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Receita não encontrada');
        this.name = 'ReceitasNotFound';
    }
}

export class ReceitasAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Receita com este nome já existe');
        this.name = 'ReceitasAlreadyExistsError';
    }
}

