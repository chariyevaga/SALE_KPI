import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import { decimalTransformer } from '../../common/decimal.js';
import { KpiAssignmentItemEntity } from '../../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../../kpi-assignments/entities/kpi-assignment.entity.js';
import { KpiDefinitionEntity } from '../../kpi-definitions/entities/kpi-definition.entity.js';

/** How the actual value got here: read from Tiger, or typed in by a manager. */
export const KPI_RESULT_SOURCES = ['calculated', 'manual'] as const;

export type KpiResultSource = (typeof KPI_RESULT_SOURCES)[number];

/**
 * What one plan row achieved (migration 1799703800000, ADR-041). Target and weight are
 * copied at calculation time, so a later change to the plan does not rewrite history;
 * the achievement columns are the score formula of docs/BUSINESS_RULES.md "Puan hesabı".
 *
 * The relations are read-only views of the foreign-key columns (persistence: false), so
 * writes only ever go through the id columns.
 */
@Entity({ name: 'kpi_results', schema: 'dbo' })
@Index('UX_kpi_results_item', ['assignmentItemId'], { unique: true })
@Index('IX_kpi_results_assignment', ['assignmentId'])
export class KpiResultEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'assignment_id', type: 'uniqueidentifier' })
  assignmentId: string;

  @ManyToOne(() => KpiAssignmentEntity, { onDelete: 'CASCADE', persistence: false })
  @JoinColumn({ name: 'assignment_id', referencedColumnName: 'id' })
  assignment?: KpiAssignmentEntity;

  @Column({ name: 'assignment_item_id', type: 'uniqueidentifier' })
  assignmentItemId: string;

  @ManyToOne(() => KpiAssignmentItemEntity, { persistence: false })
  @JoinColumn({ name: 'assignment_item_id', referencedColumnName: 'id' })
  item?: KpiAssignmentItemEntity;

  @Column({ name: 'kpi_definition_id', type: 'uniqueidentifier' })
  kpiDefinitionId: string;

  @ManyToOne(() => KpiDefinitionEntity, { persistence: false })
  @JoinColumn({ name: 'kpi_definition_id', referencedColumnName: 'id' })
  definition?: KpiDefinitionEntity;

  @Column({
    name: 'target_value',
    type: 'decimal',
    precision: 19,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  targetValue: number | null;

  @Column({
    name: 'actual_value',
    type: 'decimal',
    precision: 19,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  actualValue: number | null;

  @Column({ name: 'source', type: 'nvarchar', length: 16 })
  source: KpiResultSource;

  /** Can pass 100 and can be negative; management analysis reads the unclamped value. */
  @Column({
    name: 'raw_achievement',
    type: 'decimal',
    precision: 9,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  rawAchievement: number | null;

  @Column({
    name: 'capped_achievement',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  cappedAchievement: number | null;

  @Column({
    name: 'weight',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: decimalTransformer,
  })
  weight: number;

  @Column({
    name: 'weighted_score',
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  weightedScore: number | null;

  @Column({ name: 'calculated_at', type: 'datetime2', precision: 3, nullable: true })
  calculatedAt: Date | null;

  /** How the value was reached, JSON (migration 1799704300000, ADR-052): the conversion's days, receipts and visitors. */
  @Column({ name: 'detail', type: 'nvarchar', length: 'MAX', nullable: true })
  detail: string | null;
}
