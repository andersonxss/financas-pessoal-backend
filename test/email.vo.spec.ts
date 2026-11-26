import { Email } from '../src/domain/value-objects/user/email.vo';
import { InvalidEmailError } from '@errors';

describe('Email Value Object', () => {
    it('should create a valid email', () => {
        const emailStr = 'test@example.com';
        const email = Email.create(emailStr);
        expect(email.getValue()).toBe(emailStr);
    });

    it('should throw error for invalid email (no @)', () => {
        expect(() => Email.create('invalidemail')).toThrow(InvalidEmailError);
    });

    it('should throw error for invalid email (no domain)', () => {
        expect(() => Email.create('user@')).toThrow(InvalidEmailError);
    });

    it('should throw error for invalid email (empty)', () => {
        expect(() => Email.create('')).toThrow(InvalidEmailError);
    });

    it('should validate correct email format', () => {
        expect(Email.isValid('user@domain.com')).toBe(true);
    });

    it('should validate incorrect email format', () => {
        expect(Email.isValid('invalid')).toBe(false);
    });
});
