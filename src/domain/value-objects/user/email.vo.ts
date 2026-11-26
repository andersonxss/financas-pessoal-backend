import { InvalidEmailError } from "@errors";

export class Email {

    private constructor(private readonly value: string) { }

    static create(value: string): Email {
        if (!this.isValid(value)) {
            throw new InvalidEmailError();
        }
        return new Email(value);
    }

    static isValid(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getValue() {
        return this.value;
    }
}