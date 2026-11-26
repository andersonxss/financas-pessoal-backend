import { User } from '../src/domain/entities/user.entity';

describe('User Entity', () => {
    it('should create a user instance', () => {
        const date = new Date();
        const user = new User(
            '123',
            'Test User',
            'test@example.com',
            'password123',
            date,
            date,
        );

        expect(user).toBeDefined();
        expect(user.userId).toBe('123');
        expect(user.name).toBe('Test User');
        expect(user.email).toBe('test@example.com');
        expect(user.password).toBe('password123');
        expect(user.createdAt).toBe(date);
        expect(user.updatedAt).toBe(date);
    });
});
