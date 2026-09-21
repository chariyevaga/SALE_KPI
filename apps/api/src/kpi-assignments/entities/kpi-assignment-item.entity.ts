import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import { decimalTransformer } from '../../common/decimal.js';
import { KpiDefinitionEntity } from '../../kpi-definitions/entities/kpi-definition.entity.js';
import { KpiAssignmentEntity } from './kpi-assignment.entity.js';

/**
 * One KPI of a plan, copied from the template row it came from. Only `target_value` is
 * the employee's own; the KPI, its weight and its inputs stay as the template had them
 * (docs/BUSINESS_RULES.md "Hedef öneri raporları", ADR-039). NULL target = not set yet.
 */
@Entity({ name: 'kpi_assignment_items', schema: 'dbo' })
@Index('IX_kpi_assignment_items_assignment', ['assignmentId', 'sortOrder'])
@Index('IX_kpi_assignment_items_definition', ['kpiDefinitionId'])
export class KpiAssignmentItemEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'assignment_id', type: 'uniqueidentifier' })
  assignmentId: string;

  @ManyToOne(() => KpiAssignmentEntity, { onDelete: 'CASCADE', persistence: false })
  @JoinColumn({ name: 'assignment_id', referencedColumnName: 'id' })
  assignment?: KpiAssignmentEntity;

  @Column({ name: 'kpi_definition_id', type: 'uniqueidentifier' })
  kpiDefinitionId: string;

  @ManyToOne(() => KpiDefinitionEntity, { persistence: false })
  @JoinColumn({ name: 'kpi_definition_id', referencedColumnName: 'id' })
  definition?: KpiDefinitionEntity;

  @Column({
    name: 'weight',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: decimalTransformer,
  })
  weight: number;

  @Column({
    name: 'target_value',
    type: 'decimal',
    precision: 19,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  targetValue: number | null;

  @Column({ name: 'input_values', type: 'nvarchar', length: 'MAX', default: '{}' })
  inputValues: string;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder: number;
}
