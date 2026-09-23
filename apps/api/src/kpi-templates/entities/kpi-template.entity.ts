import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';

/** Reusable KPI template (migration 1799703300000, ADR-034); not tied to an employee or period. */
@Entity({ name: 'kpi_templates', schema: 'dbo' })
@Index('UX_kpi_templates_name', ['name'], { unique: true })
export class KpiTemplateEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'name', type: 'nvarchar', length: 200 })
  name: string;

  @Column({ name: 'description', type: 'nvarchar', length: 1000, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive: boolean;
}
