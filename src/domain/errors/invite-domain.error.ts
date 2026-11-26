export class InviteaNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Convite não encontrado');
        this.name = 'InviteaNotFound';
    }
}

export class InviteAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Categoria com este nome já existe');
        this.name = 'CategoriaAlreadyExistsError';
    }
}

export class InviteTeste extends Error {
    public readonly status = 409;

    constructor() {
        super('Convite teste');
        this.name = 'InviteTeste';
    }
}

