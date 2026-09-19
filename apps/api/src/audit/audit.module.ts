import { Global, Module } from '@nestjs/common';

import { AuditService } from './audit.service.js';

/**
 * Global so every feature module can inject AuditService, the only writer of audited
 * tables (ADR-036). The read API lives in AuditLogsModule.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
