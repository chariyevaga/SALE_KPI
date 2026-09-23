import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import { decimalTransformer } from '../../common/decimal.js';
import { KpiDefinitionEntity } from '../../kpi-definitions/entities/kpi-definition.entity.js';
import { KpiTemplateEntity } from './kpi-template.entity.js';

/**
 * One KPI inside a template. The relations are read-only views of the foreign-key
 * columns (persistence: false, same pattern as EmployeeEntity.avatar), so writes only
 * ever go through `templateId` / `kpiDefinitionId`.
 */
@Entity({ name: 'kpi_template_items', schema: 'dbo' })
@Index('IX_kpi_template_items_template', ['templateId', 'sortOrder'])
@Index('IX_kpi_template_items_definition', ['kpiDefinitionId'])
export class KpiTemplateItemEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'template_id', type: 'uniqueidentifier' })
  templateId: string;

  @ManyToOne(() => KpiTemplateEntity, { onDelete: 'CASCADE', persistence: false })
  @JoinColumn({ name: 'template_id', referencedColumnName: 'id' })
  template?: KpiTemplateEntity;

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
