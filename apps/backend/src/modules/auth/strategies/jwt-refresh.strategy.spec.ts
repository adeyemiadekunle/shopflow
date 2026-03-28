import { ConfigService } from '@nestjs/config';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  beforeEach(() => {
    strategy = new JwtRefreshStrategy({
      get: jest.fn(() => 'test-refresh-secret'),
    } as unknown as ConfigService);
  });

  it('validate() should prefer the bearer token from the authorization header', () => {
    const result = strategy.validate(
      {
        headers: { authorization: 'Bearer header-refresh-token' },
        body: { refreshToken: 'body-refresh-token' },
      } as never,
      { sub: 'user-1', email: 'buyer@example.com', role: 'buyer' },
    );

    expect(result).toEqual({
      userId: 'user-1',
      refreshToken: 'header-refresh-token',
    });
  });

  it('validate() should fall back to the request body refresh token', () => {
    const result = strategy.validate(
      {
        headers: {},
        body: { refreshToken: 'body-refresh-token' },
      } as never,
      { sub: 'user-1', email: 'buyer@example.com', role: 'buyer' },
    );

    expect(result).toEqual({
      userId: 'user-1',
      refreshToken: 'body-refresh-token',
    });
  });
});
