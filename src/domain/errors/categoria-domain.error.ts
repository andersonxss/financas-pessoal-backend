export class CategoriaNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Categoria não encontrado');
        this.name = 'CategoriaNotFound';
    }
}

export class CategoriaAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Categoria com este nome já existe');
        this.name = 'CategoriaAlreadyExistsError';
    }
}

