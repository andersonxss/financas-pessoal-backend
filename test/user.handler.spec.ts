import { CreateUserHandler } from '../src/application/commands/user/create-user/create-user.handler';

describe('User handler', () => {
    it('should create a user handler', async () => {
        const repositoryMock = {
            save: jest.fn(),
            findByEmail: jest.fn(),
        };
        const eventBusMock = {
            publish: jest.fn(),
        } as any;

        const user = new CreateUserHandler(repositoryMock, eventBusMock);

        expect(user).toBeDefined();

        await user.execute({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        });


    });
});
