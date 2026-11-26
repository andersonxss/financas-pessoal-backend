export class InvalidEmailError extends Error {
    public readonly status = 400;

    constructor() {
        super('Email inválido');
        this.name = 'InvalidEmailError';
    }
}

export class UserAlreadyExistsError extends Error {
    public readonly status = 409;

    constructor() {
        super('Usuário com este e-mail já existe');
        this.name = 'UserAlreadyExistsError';
    }
}

export class UserNotFound extends Error {
    public readonly status = 404;

    constructor() {
        super('Usuário não encontrado');
        this.name = 'UserNotFound';
    }
}

export class UserCredentialError extends Error {
    public readonly status = 401;

    constructor() {
        super('Credenciais inválidas');
        this.name = 'UserCredentialError';
    }
}