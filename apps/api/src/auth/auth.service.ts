import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type FindOptionsWhere, IsNull, MoreThan, Not, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import { setRequestActor } from '../common/request-context.js';
import { DeviceSessionEntity } from '../device-sessions/entities/device-session.entity.js';
import { toEmployeeResponse } from '../employees/employee-response.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RefreshDto } from './dto/refresh.dto.js';
import { AttemptLimiter, tooManyAttempts } from './attempt-limiter.js';
import { hashPasswordSync } from './password-hash.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import type { AuthResponse, DeviceSessionResponse } from './auth.types.js';

const MINUTE = 60_000;

/**
 * Guessing limits (security review 2026-09-24). A username locks after 5 wrong passwords in
 * 15 minutes, an IP after 20 (Docker Desktop may show every client as one address, hence
 * the wider limit), the "current password" of a password change after 5 per employee.
 */
const USERNAME_LIMIT = { maxFailures: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE };
const IP_LIMIT = { maxFailures: 20, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE };
const PASSWORD_CHANGE_LIMIT = { maxFailures: 5, windowMs: 15 * MINUTE, blockMs: 15 * MINUTE };

/**
 * Verified against when the username is unknown or inactive, so every failed sign-in costs
 * one scrypt run and the response time does not tell which usernames exist.
 */
const DUMMY_PASSWORD_HASH = hashPasswordSync(randomUUID());

interface LoginMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

/**
 * SQL Server returns `uniqueidentifier` columns upper-cased, while the values minted here with
 * randomUUID() — and signed into the refresh token — are lower-case. Comparing those two spellings
 * with `!==` rejects every refresh, so GUIDs are matched without regard to case.
 */
function equalsGuid(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(DeviceSessionEntity)
    private readonly sessionRepository: Repository<DeviceSessionEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private readonly usernameAttempts = new AttemptLimiter(USERNAME_LIMIT);
  private readonly ipAttempts = new AttemptLimiter(IP_LIMIT);
  private readonly passwordChangeAttempts = new AttemptLimiter(PASSWORD_CHANGE_LIMIT);
  private readonly confirmationAttempts = new AttemptLimiter(PASSWORD_CHANGE_LIMIT);

  /**
   * Re-checks the signed-in employee's own password before a sensitive action, e.g. closing
   * or reopening a KPI period (ADR-053): having full access is not enough on its own. A wrong
   * password is 400 `AUTH_PASSWORD_CONFIRMATION_FAILED`, not 401, so the client does not
   * mistake it for an expired session; 5 wrong ones in 15 minutes lock it like a sign-in.
   */
  async confirmOwnPassword(employeeId: string, password: string): Promise<void> {
    const attemptKey = employeeId.toLowerCase();
    const retryAfter = this.confirmationAttempts.retryAfterSeconds(attemptKey);

    if (retryAfter > 0) {
      throw tooManyAttempts(retryAfter);
    }

    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.passwordHash')
      .where('employee.id = :employeeId', { employeeId })
      .getOne();

    if (!employee || !(await this.passwordService.verify(password, employee.passwordHash))) {
      this.confirmationAttempts.recordFailure(attemptKey);
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'The password does not match.',
        code: 'AUTH_PASSWORD_CONFIRMATION_FAILED',
      });
    }

    this.confirmationAttempts.reset(attemptKey);
  }

  async login(dto: LoginDto, metadata: LoginMetadata): Promise<AuthResponse> {
    const usernameKey = dto.username.trim().toLowerCase();
    const ipKey = metadata.ipAddress ?? 'unknown';
    const retryAfter = Math.max(
      this.usernameAttempts.retryAfterSeconds(usernameKey),
      this.ipAttempts.retryAfterSeconds(ipKey),
    );

    // A blocked sign-in is refused before the password is even looked at.
    if (retryAfter > 0) {
      throw tooManyAttempts(retryAfter);
    }

    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.passwordHash')
      .leftJoinAndSelect('employee.avatar', 'avatar')
      .where('employee.username = :username', { username: dto.username })
      .getOne();

    const passwordMatches = await this.passwordService.verify(
      dto.password,
      employee?.isActive ? employee.passwordHash : DUMMY_PASSWORD_HASH,
    );

    if (!employee?.isActive || !passwordMatches) {
      this.usernameAttempts.recordFailure(usernameKey);
      this.ipAttempts.recordFailure(ipKey);
      throw new UnauthorizedException('Invalid username or password.');
    }

    this.usernameAttempts.reset(usernameKey);

    // The session row written below is attributed to the employee signing in (ADR-036).
    setRequestActor(employee.id);

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(DeviceSessionEntity);
      const existing = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.employeeId = :employeeId', { employeeId: employee.id })
        .andWhere('session.deviceId = :deviceId', { deviceId: dto.deviceId })
        .getOne();
      const session =
        existing ??
        repository.create({
          id: randomUUID(),
          employeeId: employee.id,
          deviceId: dto.deviceId,
        });

      session.deviceName = dto.deviceName?.trim() || null;
      session.ipAddress = metadata.ipAddress;
      session.userAgent = metadata.userAgent;
      session.lastSeenAt = new Date();
      session.revokedAt = null;
      session.revocationReason = null;
      session.tokenFamilyId = randomUUID();
      session.tokenVersion = 1;
      session.rememberMe = dto.rememberMe ?? false;

      const response = this.issueTokens(employee, session);
      const values = {
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        lastSeenAt: session.lastSeenAt,
        revokedAt: null,
        revocationReason: null,
        tokenFamilyId: session.tokenFamilyId,
        tokenVersion: session.tokenVersion,
        rememberMe: session.rememberMe,
        refreshTokenHash: this.hashRefreshToken(response.refreshToken),
        expiresAt: new Date(response.refreshTokenExpiresAt),
      };
      const options = { context: { event: 'login' } };

      if (existing) {
        await this.audit.update(manager, DeviceSessionEntity, { id: existing.id }, values, options);
      } else {
        await this.audit.insert(
          manager,
          DeviceSessionEntity,
          { id: session.id, employeeId: employee.id, deviceId: dto.deviceId, ...values },
          options,
        );
      }

      return response;
    });
  }

  async refresh(dto: RefreshDto): Promise<AuthResponse> {
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);

    if (payload.deviceId !== dto.deviceId) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const response = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(DeviceSessionEntity);
      const session = await repository
        .createQueryBuilder('session')
        .addSelect('session.refreshTokenHash')
        .leftJoinAndSelect('session.employee', 'employee')
        .leftJoinAndSelect('employee.avatar', 'avatar')
        .setLock('pessimistic_write')
        .where('session.id = :sessionId', { sessionId: payload.sid })
        .getOne();

      if (
        !session ||
        !session.employee.isActive ||
        session.revokedAt ||
        session.expiresAt.getTime() <= Date.now() ||
        !equalsGuid(session.employeeId, payload.sub) ||
        session.deviceId !== payload.deviceId ||
        !equalsGuid(session.tokenFamilyId, payload.familyId)
      ) {
        return null;
      }

      if (
        session.tokenVersion !== payload.version ||
        !this.matchesRefreshToken(dto.refreshToken, session.refreshTokenHash)
      ) {
        // Nobody is signed in on this path: the system revokes the reused token family.
        await this.audit.update(
          manager,
          DeviceSessionEntity,
          { id: session.id },
          { revokedAt: new Date(), revocationReason: 'refresh_token_reuse' },
        );
        return null;
      }

      setRequestActor(session.employeeId);
      session.tokenVersion += 1;
      session.lastSeenAt = new Date();
      const nextResponse = this.issueTokens(session.employee, session);
      // Rotation happens on every refresh, so it is stamped but not logged (ADR-036).
      await this.audit.update(
        manager,
        DeviceSessionEntity,
        { id: session.id },
        {
          tokenVersion: session.tokenVersion,
          lastSeenAt: session.lastSeenAt,
          refreshTokenHash: this.hashRefreshToken(nextResponse.refreshToken),
          expiresAt: new Date(nextResponse.refreshTokenExpiresAt),
        },
        { log: false },
      );

      return nextResponse;
    });

    if (!response) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    return response;
  }

  /**
   * The access token's session must still be live: signing out, "sign out everywhere", a
   * password change, an administrator revoking the device or refresh-token reuse end it at
   * once, instead of leaving its access token usable until it expires.
   */
  async assertSessionActive(sessionId: string, employeeId: string): Promise<void> {
    const live = await this.sessionRepository.exists({
      where: { id: sessionId, employeeId, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) },
    });

    if (!live) {
      throw new UnauthorizedException('The session has ended.');
    }
  }

  async getActiveEmployee(employeeId: string): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, isActive: true },
    });

    if (!employee) {
      throw new UnauthorizedException('The employee account is not active.');
    }

    return employee;
  }

  async changePassword(
    employeeId: string,
    currentSessionId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const attemptKey = employeeId.toLowerCase();
    const retryAfter = this.passwordChangeAttempts.retryAfterSeconds(attemptKey);

    if (retryAfter > 0) {
      throw tooManyAttempts(retryAfter);
    }

    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.passwordHash')
      .where('employee.id = :employeeId', { employeeId })
      .getOne();

    if (
      !employee ||
      !(await this.passwordService.verify(dto.currentPassword, employee.passwordHash))
    ) {
      this.passwordChangeAttempts.recordFailure(attemptKey);
      throw new UnauthorizedException('Current password is incorrect.');
    }

    this.passwordChangeAttempts.reset(attemptKey);

    const passwordHash = await this.passwordService.hash(dto.newPassword);

    await this.dataSource.transaction(async (manager) => {
      await this.audit.update(manager, EmployeeEntity, { id: employee.id }, { passwordHash });
      await this.audit.update(
        manager,
        DeviceSessionEntity,
        { employeeId, id: Not(currentSessionId), revokedAt: IsNull() },
        { revokedAt: new Date(), revocationReason: 'password_changed' },
      );
    });
  }

  async logoutCurrent(employeeId: string, sessionId: string): Promise<void> {
    await this.revokeSessions({ id: sessionId, employeeId, revokedAt: IsNull() }, 'logout');
  }

  async logoutAll(employeeId: string): Promise<void> {
    await this.revokeSessions({ employeeId, revokedAt: IsNull() }, 'logout_all');
  }

  async listActiveDevices(employeeId: string): Promise<DeviceSessionResponse[]> {
    const sessions = await this.sessionRepository.find({
      where: {
        employeeId,
        expiresAt: MoreThan(new Date()),
        revokedAt: IsNull(),
      },
      order: { lastSeenAt: 'DESC' },
    });

    return sessions.map((session) => ({
      createdAt: session.createdAt.toISOString(),
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      expiresAt: session.expiresAt.toISOString(),
      id: session.id,
      ipAddress: session.ipAddress,
      lastSeenAt: session.lastSeenAt.toISOString(),
      rememberMe: session.rememberMe,
    }));
  }

  async revokeDevice(employeeId: string, sessionId: string): Promise<void> {
    await this.revokeSessions({ id: sessionId, employeeId, revokedAt: IsNull() }, 'device_revoked');
  }

  private async revokeSessions(
    where: FindOptionsWhere<DeviceSessionEntity>,
    revocationReason: string,
  ): Promise<void> {
    await this.audit.update(this.dataSource.manager, DeviceSessionEntity, where, {
      revokedAt: new Date(),
      revocationReason,
    });
  }

  private issueTokens(employee: EmployeeEntity, session: DeviceSessionEntity): AuthResponse {
    const access = this.tokenService.createAccessToken(employee.id, session.id);
    const refresh = this.tokenService.createRefreshToken(
      employee.id,
      session.id,
      session.deviceId,
      session.tokenFamilyId,
      session.tokenVersion,
      session.rememberMe
        ? this.tokenService.getRefreshTtlSeconds()
        : this.tokenService.getShortSessionTtlSeconds(),
    );

    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      employee: toEmployeeResponse(employee),
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
    };
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('base64url');
  }

  private matchesRefreshToken(token: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashRefreshToken(token));
    const expected = Buffer.from(expectedHash);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
