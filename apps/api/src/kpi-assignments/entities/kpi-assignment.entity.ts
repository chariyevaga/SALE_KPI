import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import { decimalTransformer } from '../../common/decimal.js';
import { EmployeeEntity } from '../../employees/entities/employee.entity.js';
import { KpiPeriodEntity } from '../../kpi-periods/entities/kpi-period.entity.js';
import { KpiTemplateEntity } from '../../kpi-templates/entities/kpi-template.entity.js';

/**
 * One employee's KPI plan in one period (migration 1799703600000, ADR-039): the template
 * it came from and, in `kpi_assignment_items`, the KPI rows copied from that template.
 * `template_name` keeps the name the template had when it was assigned.
 *
 * The relations are read-only views of the foreign-key columns (persistence: false, the
 * pattern of KpiTemplateItemEntity), so writes only ever go through the id columns.
 */
@Entity({ name: 'kpi_assignments', schema: 'dbo' })
@Index('UX_kpi_assignments_period_employee', ['periodId', 'employeeId'], { unique: true })
@Index('IX_kpi_assignments_employee', ['employeeId', 'periodId'])
export class KpiAssignmentEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'period_id', type: 'uniqueidentifier' })
  periodId: string;

  @ManyToOne(() => KpiPeriodEntity, { persistence: false })
  @JoinColumn({ name: 'period_id', referencedColumnName: 'id' })
  period?: KpiPeriodEntity;

  @Column({ name: 'employee_id', type: 'uniqueidentifier' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { persistence: false })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;

  @Column({ name: 'template_id', type: 'uniqueidentifier' })
  templateId: string;

  @ManyToOne(() => KpiTemplateEntity, { persistence: false })
  @JoinColumn({ name: 'template_id', referencedColumnName: 'id' })
  template?: KpiTemplateEntity;

  @Column({ name: 'template_name', type: 'nvarchar', length: 200 })
  templateName: string;

  /**
   * The plan's score, written by the calculation together with `kpi_results` (ADR-041).
   * NULL means never calculated; `scored_item_count` says how many rows the total covers,
   * so a plan with rows still missing a target or a manual actual can be told apart.
   */
  @Column({
    name: 'total_score',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  totalScore: number | null;

  @Column({ name: 'scored_item_count', type: 'int', nullable: true })
  scoredItemCount: number | null;

  @Column({ name: 'score_calculated_at', type: 'datetime2', precision: 3, nullable: true })
  scoreCalculatedAt: Date | null;
}
