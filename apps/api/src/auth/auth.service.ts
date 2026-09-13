import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThan, Not, Repository } from 'typeorm';

import { DeviceSessionEntity } from '../device-sessions/entities/device-session.entity.js';
import { toEmployeeResponse } from '../employees/employee-response.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RefreshDto } from './dto/refresh.dto.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import type { AuthResponse, DeviceSessionResponse } from './auth.types.js';

interface LoginMetadata {
  ipAddress: string | null;
  userAgent: string | null;
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
  ) {}

  async login(dto: LoginDto, metadata: LoginMetadata): Promise<AuthResponse> {
    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.passwordHash')
      .leftJoinAndSelect('employee.avatar', 'avatar')
      .where('employee.username = :username', { username: dto.username })
      .getOne();

    if (
      !employee ||
      !employee.isActive ||
      !(await this.passwordService.verify(dto.password, employee.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(DeviceSessionEntity);
      let session = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.employeeId = :employeeId', { employeeId: employee.id })
        .andWhere('session.deviceId = :deviceId', { deviceId: dto.deviceId })
        .getOne();

      if (!session) {
        session = repository.create({
          id: randomUUID(),
          employeeId: employee.id,
          deviceId: dto.deviceId,
        });
      }

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
      session.refreshTokenHash = this.hashRefreshToken(response.refreshToken);
      session.expiresAt = new Date(response.refreshTokenExpiresAt);
      await repository.save(session);

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
        session.employeeId !== payload.sub ||
        session.deviceId !== payload.deviceId ||
        session.tokenFamilyId !== payload.familyId
      ) {
        return null;
      }

      if (
        session.tokenVersion !== payload.version ||
        !this.matchesRefreshToken(dto.refreshToken, session.refreshTokenHash)
      ) {
        session.revokedAt = new Date();
        session.revocationReason = 'refresh_token_reuse';
        await repository.save(session);
        return null;
      }

      session.tokenVersion += 1;
      session.lastSeenAt = new Date();
      const nextResponse = this.issueTokens(session.employee, session);
      session.refreshTokenHash = this.hashRefreshToken(nextResponse.refreshToken);
      session.expiresAt = new Date(nextResponse.refreshTokenExpiresAt);
      await repository.save(session);

      return nextResponse;
    });

    if (!response) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    return response;
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
    const employee = await this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.passwordHash')
      .where('employee.id = :employeeId', { employeeId })
      .getOne();

    if (
      !employee ||
      !(await this.passwordService.verify(dto.currentPassword, employee.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    employee.passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.employeeRepository.save(employee);

    await this.sessionRepository.update(
      { employeeId, id: Not(currentSessionId), revokedAt: IsNull() },
      { revokedAt: new Date(), revocationReason: 'password_changed' },
    );
  }

  async logoutCurrent(employeeId: string, sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId, employeeId, revokedAt: IsNull() },
      { revokedAt: new Date(), revocationReason: 'logout' },
    );
  }

  async logoutAll(employeeId: string): Promise<void> {
    await this.sessionRepository.update(
      { employeeId, revokedAt: IsNull() },
      { revokedAt: new Date(), revocationReason: 'logout_all' },
    );
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
    await this.sessionRepository.update(
      { id: sessionId, employeeId, revokedAt: IsNull() },
      { revokedAt: new Date(), revocationReason: 'device_revoked' },
    );
  }

  private issueTokens(
    employee: EmployeeEntity,
    session: DeviceSessionEntity,
  ): AuthResponse {
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
