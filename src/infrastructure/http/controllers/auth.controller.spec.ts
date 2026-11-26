import { UserRole } from '@entities';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../../auth';
import { AuthController } from './auth.controller';

describe('AuthController session cookies', () => {
  it('aligns cookie lifetime with the access and refresh JWT configuration', async () => {
    const auth = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          userId: 'd39052dc-6f0d-42e4-867d-240f955195dd',
          tenantId: 'a68cdce7-99d7-4140-a17a-e2e4c7a8aa68',
          email: 'member@example.com',
          name: 'Member',
          role: UserRole.MEMBER,
        },
      }),
    };
    const values: Record<string, string | undefined> = {
      NODE_ENV: 'development',
      COOKIE_DOMAIN: undefined,
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '30d',
    };
    const config = { get: jest.fn((key: string) => values[key]) };
    const response = { cookie: jest.fn() };
    const controller = new AuthController(auth as never, config as never);

    await controller.login(
      { tenant: 'principal', email: 'member@example.com', password: 'secret' },
      response as never,
    );

    expect(response.cookie).toHaveBeenNthCalledWith(
      1,
      ACCESS_COOKIE,
      'access-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60_000,
      },
    );
    expect(response.cookie).toHaveBeenNthCalledWith(
      2,
      REFRESH_COOKIE,
      'refresh-token',
      {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60_000,
      },
    );
  });
});
