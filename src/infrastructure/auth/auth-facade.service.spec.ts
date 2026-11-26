import { createHash } from 'node:crypto';
import { UserRole } from '@entities';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthFacadeService } from './auth-facade.service';
import { TenantContextService } from './tenant-context.service';
import { AuthTokenOrmEntity, AuthTokenType, TenantOrmEntity, UserOrmEntity } from '../persistence';

describe('AuthFacadeService', () => {
  it('resets the password with a valid current token and consumes it', async () => {
    const tenantId = 'a68cdce7-99d7-4140-a17a-e2e4c7a8aa68';
    const tokenId = 'bfa914f3-d1cf-4adc-b203-c0de34b055ef';
    const userId = 'd39052dc-6f0d-42e4-867d-240f955195dd';
    const token = `${tenantId}.${tokenId}.secret`;
    const record = {
      id: tokenId,
      tenantId,
      userId,
      type: AuthTokenType.PASSWORD_RESET,
      tokenHash: createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null as Date | null,
    };
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(record),
    };
    const tokenRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn().mockResolvedValue(record),
    };
    const userRepository = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const manager = {
      query: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn((entity: unknown) => {
        if (entity === AuthTokenOrmEntity) return tokenRepository;
        if (entity === UserOrmEntity) return userRepository;
        throw new Error('unexpected repository');
      }),
    };
    const dataSource = {
      transaction: (callback: (value: typeof manager) => Promise<unknown>) => callback(manager),
    };
    const service = new AuthFacadeService(
      dataSource as never,
      {} as never,
      {} as never,
      new TenantContextService(),
      {} as never,
    );

    await service.resetPassword(token, 'Aa1!aa');

    expect(userRepository.update).toHaveBeenCalledTimes(1);
    const [criteria, passwordUpdate] = userRepository.update.mock.calls[0] as unknown as [
      { id: string; tenantId: string },
      { password: string; refreshTokenHash: null },
    ];
    expect(criteria).toEqual({ id: userId, tenantId });
    expect(passwordUpdate.refreshTokenHash).toBeNull();
    await expect(bcrypt.compare('Aa1!aa', passwordUpdate.password)).resolves.toBe(true);
    expect(record.usedAt).toBeInstanceOf(Date);
    expect(tokenRepository.save).toHaveBeenCalledWith(record);
  });

  it('rotates a valid refresh token and renews the session', async () => {
    const tenantId = 'a68cdce7-99d7-4140-a17a-e2e4c7a8aa68';
    const userId = 'd39052dc-6f0d-42e4-867d-240f955195dd';
    const currentRefreshToken = 'current-refresh-token';
    const nextRefreshToken = 'next-refresh-token';
    const user = {
      id: userId,
      tenantId,
      email: 'member@example.com',
      name: 'Member',
      role: UserRole.MEMBER,
      active: true,
      refreshTokenHash: createHash('sha256').update(currentRefreshToken).digest('hex'),
    };
    const queryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user),
    };
    const tenantRepository = {
      findOne: jest.fn().mockResolvedValue({ id: tenantId, active: true }),
    };
    const userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const manager = {
      query: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn((entity: unknown) => {
        if (entity === TenantOrmEntity) return tenantRepository;
        if (entity === UserOrmEntity) return userRepository;
        throw new Error('unexpected repository');
      }),
    };
    const dataSource = {
      transaction: (callback: (value: typeof manager) => Promise<unknown>) => callback(manager),
    };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        userId,
        tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
        type: 'refresh',
      }),
      signAsync: jest.fn()
        .mockResolvedValueOnce('next-access-token')
        .mockResolvedValueOnce(nextRefreshToken),
    };
    const config = {
      getOrThrow: jest.fn((key: string) => key === 'JWT_ACCESS_SECRET'
        ? 'access-secret-with-at-least-32-characters'
        : 'refresh-secret-with-at-least-32-characters'),
      get: jest.fn((key: string) => key === 'JWT_ACCESS_EXPIRES_IN' ? '15m' : '30d'),
    };
    const service = new AuthFacadeService(
      dataSource as never,
      jwtService as never,
      config as never,
      new TenantContextService(),
      {} as never,
    );

    const result = await service.refresh(currentRefreshToken);

    expect(result).toEqual({
      accessToken: 'next-access-token',
      refreshToken: nextRefreshToken,
      user: {
        userId,
        tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'access' }),
      expect.objectContaining({ expiresIn: '15m' }),
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: 'refresh' }),
      expect.objectContaining({ expiresIn: '30d' }),
    );
    expect(userRepository.update).toHaveBeenCalledWith(
      { id: userId, tenantId },
      { refreshTokenHash: createHash('sha256').update(nextRefreshToken).digest('hex') },
    );
  });

  it('rejects refresh tokens when the tenant is inactive', async () => {
    const tenantRepository = { findOne: jest.fn().mockResolvedValue(null) };
    const userRepository = { createQueryBuilder: jest.fn() };
    const manager = {
      query: jest.fn().mockResolvedValue(undefined),
      getRepository: jest.fn((entity: unknown) => {
        if (entity === TenantOrmEntity) return tenantRepository;
        if (entity === UserOrmEntity) return userRepository;
        throw new Error('unexpected repository');
      }),
    };
    const dataSource = {
      transaction: (callback: (value: typeof manager) => Promise<unknown>) => callback(manager),
    };
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        userId: 'bfa914f3-d1cf-4adc-b203-c0de34b055ef',
        tenantId: 'a68cdce7-99d7-4140-a17a-e2e4c7a8aa68',
        email: 'member@example.com',
        name: 'Member',
        role: UserRole.MEMBER,
        type: 'refresh',
      }),
    };
    const config = {
      getOrThrow: jest.fn().mockReturnValue('refresh-secret-with-at-least-32-characters'),
    };
    const service = new AuthFacadeService(
      dataSource as never,
      jwtService as never,
      config as never,
      new TenantContextService(),
      {} as never,
    );

    await expect(service.refresh('refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tenantRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'a68cdce7-99d7-4140-a17a-e2e4c7a8aa68',
        active: true,
      },
    });
    expect(userRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
