import { ValidationPipe } from '@nestjs/common';
import { AcceptInviteDto, ResetPasswordDto } from './enterprise-auth.dto';

describe('AcceptInviteDto', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const metadata = { type: 'body' as const, metatype: AcceptInviteDto };
  const payload = {
    token: 'tenant-id.invite-id.secret',
    name: 'Ana',
    password: 'Aa!aaa',
  };

  it('accepts the exact invite acceptance contract', async () => {
    await expect(pipe.transform(payload, metadata)).resolves.toEqual(payload);
  });

  it('rejects the client-only password confirmation field', async () => {
    await expect(
      pipe.transform({ ...payload, confirmation: payload.password }, metadata),
    ).rejects.toMatchObject({
      response: { statusCode: 400 },
    });
  });

  it.each([
    ['fewer than six characters', 'Aa!aa'],
    ['no uppercase letter', 'aa!aaa'],
    ['no lowercase letter', 'AA!AAA'],
    ['no special character', 'Aaaaaa'],
  ])('rejects a password with %s', async (_case, password) => {
    await expect(
      pipe.transform({ ...payload, password }, metadata),
    ).rejects.toMatchObject({
      response: { statusCode: 400 },
    });
  });
});

describe('ResetPasswordDto', () => {
  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const metadata = { type: 'body' as const, metatype: ResetPasswordDto };
  const payload = {
    token: 'tenant-id.token-id.secret',
    password: 'Aa1!aa',
  };

  it('accepts the password reset contract', async () => {
    await expect(pipe.transform(payload, metadata)).resolves.toEqual(payload);
  });

  it.each([
    ['fewer than six characters', 'Aa1!a'],
    ['no uppercase letter', 'senhaforte1!'],
    ['no lowercase letter', 'SENHAFORTE1!'],
    ['no number', 'SenhaMuitoForte!'],
    ['no special character', 'SenhaMuitoForte1'],
  ])('rejects a password with %s', async (_case, password) => {
    await expect(
      pipe.transform({ ...payload, password }, metadata),
    ).rejects.toMatchObject({
      response: { statusCode: 400 },
    });
  });
});
