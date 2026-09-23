import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import { decimalTransformer } from '../../common/decimal.js';
import { EmployeeEntity } from '../../employees/entities/employee.entity.js';
import type { SalaryCurrency } from '../employee-salary-rules.js';

/**
 * An employee's salary from a month on (migration 1799704200000, ADR-048): the amount and
 * how it splits into a fixed and a KPI-dependent part. The salary of a month is the latest
 * row whose `effective_month` is not after it.
 *
 * The employee relation is a read-only view of the id column (persistence: false).
 */
@Entity({ name: 'employee_salaries', schema: 'dbo' })
@Index('UX_employee_salaries_employee_month', ['employeeId', 'effectiveMonth'], { unique: true })
export class EmployeeSalaryEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'employee_id', type: 'uniqueidentifier' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { persistence: false })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee?: EmployeeEntity;

  /** First day of the month the salary takes effect from, `YYYY-MM-01`. */
  @Column({ name: 'effective_month', type: 'date', utc: true })
  effectiveMonth: string;

  @Column({
    name: 'amount',
    type: 'decimal',
    precision: 19,
    scale: 2,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ name: 'currency', type: 'nvarchar', length: 3, default: 'TMT' })
  currency: SalaryCurrency;

  @Column({
    name: 'fixed_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: decimalTransformer,
  })
  fixedPercent: number;

  @Column({
    name: 'kpi_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: decimalTransformer,
  })
  kpiPercent: number;
}
