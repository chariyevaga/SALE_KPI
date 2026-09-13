import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';

import { getTokenConfig } from '../config/environment.js';

const TOKEN_ISSUER = 'retail-kpi-api';
const TOKEN_AUDIENCE = 'retail-kpi-web';
const TOKEN_HEADER = { alg: 'HS256', typ: 'JWT' } as const;

interface BaseTokenPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  sid: string;
  sub: string;
  type: 'access' | 'refresh';
}

export interface AccessTokenPayload extends BaseTokenPayload {
  type: 'access';
}

export interface RefreshTokenPayload extends BaseTokenPayload {
  deviceId: string;
  familyId: string;
  type: 'refresh';
  version: number;
}

export interface SignedToken {
  expiresAt: Date;
  token: string;
}

function encodeJson(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class TokenService {
  private readonly config = getTokenConfig();

  createAccessToken(employeeId: string, sessionId: string): SignedToken {
    return this.sign(
      {
        sid: sessionId,
        sub: employeeId,
        type: 'access',
      },
      this.config.accessSecret,
      this.config.accessTtlSeconds,
    );
  }

  createRefreshToken(
    employeeId: string,
    sessionId: string,
    deviceId: string,
    familyId: string,
    version: number,
    ttlSeconds: number = this.config.refreshTtlSeconds,
  ): SignedToken {
    return this.sign(
      {
        deviceId,
        familyId,
        sid: sessionId,
        sub: employeeId,
        type: 'refresh',
        version,
      },
      this.config.refreshSecret,
      ttlSeconds,
    );
  }

  getShortSessionTtlSeconds(): number {
    return this.config.shortSessionTtlSeconds;
  }

  getRefreshTtlSeconds(): number {
    return this.config.refreshTtlSeconds;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const payload = this.verify(token, this.config.accessSecret, 'access');
    return payload as unknown as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    const payload = this.verify(token, this.config.refreshSecret, 'refresh');

    if (
      typeof payload.deviceId !== 'string' ||
      typeof payload.familyId !== 'string' ||
      !Number.isInteger(payload.version)
    ) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    return payload as unknown as RefreshTokenPayload;
  }

  private sign(
    claims: Record<string, string | number>,
    secret: string,
    ttlSeconds: number,
  ): SignedToken {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAtSeconds = issuedAt + ttlSeconds;
    const payload = {
      ...claims,
      aud: TOKEN_AUDIENCE,
      exp: expiresAtSeconds,
      iat: issuedAt,
      iss: TOKEN_ISSUER,
      jti: randomUUID(),
    };
    const encodedHeader = encodeJson(TOKEN_HEADER);
    const encodedPayload = encodeJson(payload);
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', secret).update(unsignedToken).digest('base64url');

    return {
      expiresAt: new Date(expiresAtSeconds * 1000),
      token: `${unsignedToken}.${signature}`,
    };
  }

  private verify(
    token: string,
    secret: string,
    expectedType: 'access' | 'refresh',
  ): Record<string, unknown> {
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    try {
      const header = JSON.parse(Buffer.from(encodedHeader!, 'base64url').toString()) as unknown;
      const payload = JSON.parse(Buffer.from(encodedPayload!, 'base64url').toString()) as unknown;

      if (!isRecord(header) || header.alg !== 'HS256' || header.typ !== 'JWT' || !isRecord(payload)) {
        throw new Error('Invalid token structure.');
      }

      const expectedSignature = createHmac('sha256', secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest();
      const actualSignature = Buffer.from(encodedSignature!, 'base64url');

      if (
        expectedSignature.length !== actualSignature.length ||
        !timingSafeEqual(expectedSignature, actualSignature)
      ) {
        throw new Error('Invalid token signature.');
      }

      const now = Math.floor(Date.now() / 1000);

      if (
        payload.iss !== TOKEN_ISSUER ||
        payload.aud !== TOKEN_AUDIENCE ||
        payload.type !== expectedType ||
        typeof payload.sub !== 'string' ||
        typeof payload.sid !== 'string' ||
        typeof payload.iat !== 'number' ||
        typeof payload.exp !== 'number' ||
        payload.exp <= now
      ) {
        throw new Error('Invalid token claims.');
      }

      return payload;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
