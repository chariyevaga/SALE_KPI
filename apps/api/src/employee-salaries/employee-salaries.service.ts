import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Not, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { isPeriodOpen, periodLabel } from '../kpi-periods/kpi-period-rules.js';
import type { SaveEmployeeSalaryDto } from './dto/save-employee-salary.dto.js';
import { EmployeeSalaryEntity } from './entities/employee-salary.entity.js';
import {
  salaryMonthExists,
  salaryPercentTotal,
  salaryPeriodClosed,
} from './employee-salary-errors.js';
import {
  type EmployeeSalaryInForceResponse,
  type EmployeeSalaryListResponse,
  type EmployeeSalaryResponse,
  toEmployeeSalaryResponse,
} from './employee-salary-response.js';
import {
  closedMonthsChanged,
  monthOf,
  type SalaryFigures,
  percentsAddUp,
  salaryInForce,
  salaryMonthStart,
} from './employee-salary-rules.js';

function isUniqueViolation(error: unknown): boolean {
  const number = (error as { driverError?: { number?: number } }).driverError?.number;
  return number === 2_601 || number === 2_627;
}

/**
 * Employee salaries (ADR-048), written only through AuditService so every change lands in
 * the record trail. Access is limited to `full_access` by the controller.
 */
@Injectable()
export class EmployeeSalariesService {
  constructor(
    @InjectRepository(EmployeeSalaryEntity)
    private readonly salaryRepository: Repository<EmployeeSalaryEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Every salary of the employee, newest month first, and the one in force this month. A
   * person's salary history is a handful of rows, so the list is not paged.
   */
  async list(employeeId: string): Promise<EmployeeSalaryListResponse> {
    await this.assertEmployee(employeeId);

    const rows = await this.salaryRepository.find({
      where: { employeeId },
      order: { effectiveMonth: 'DESC' },
    });
    const current = salaryInForce(rows, monthOf(new Date()));

    return {
      current: current ? toEmployeeSalaryResponse(current) : null,
      items: rows.map(toEmployeeSalaryResponse),
    };
  }

  /**
   * The salary in force in `month` (default this month, UTC). Used by the KPI screens to show
   * what the KPI part of the salary is worth; the controller decides who may ask for whom.
   */
  async inForce(
    employeeId: string,
    month: string | undefined,
  ): Promise<EmployeeSalaryInForceResponse> {
    const target = month ?? monthOf(new Date());
    const salary = await this.salaryRepository.findOne({
      where: { employeeId, effectiveMonth: LessThanOrEqual(salaryMonthStart(target)) },
      order: { effectiveMonth: 'DESC' },
    });

    return { month: target, salary: salary ? toEmployeeSalaryResponse(salary) : null };
  }

  async create(employeeId: string, dto: SaveEmployeeSalaryDto): Promise<EmployeeSalaryResponse> {
    await this.assertEmployee(employeeId);
    assertPercents(dto);

    const effectiveMonth = salaryMonthStart(dto.effectiveMonth);

    if (await this.salaryRepository.existsBy({ employeeId, effectiveMonth })) {
      throw salaryMonthExists(dto.effectiveMonth);
    }

    const before = await this.salaryRepository.find({ where: { employeeId } });

    await this.assertClosedMonthsUntouched(employeeId, before, [
      ...before,
      { ...dto, effectiveMonth },
    ]);

    try {
      const created = await this.audit.insert(this.dataSource.manager, EmployeeSalaryEntity, {
        employeeId,
        effectiveMonth,
        amount: dto.amount,
        currency: dto.currency,
        fixedPercent: dto.fixedPercent,
        kpiPercent: dto.kpiPercent,
      });

      return toEmployeeSalaryResponse(
        await this.salaryRepository.findOneByOrFail({ id: created.id }),
      );
    } catch (error: unknown) {
      // Someone added the same month a moment earlier.
      if (isUniqueViolation(error)) {
        throw salaryMonthExists(dto.effectiveMonth);
      }

      throw error;
    }
  }

  /** Corrects a salary; moving it to a month that already has one is refused. */
  async update(id: string, dto: SaveEmployeeSalaryDto): Promise<EmployeeSalaryResponse> {
    const salary = await this.findSalary(id);

    assertPercents(dto);

    const effectiveMonth = salaryMonthStart(dto.effectiveMonth);
    const taken = await this.salaryRepository.existsBy({
      employeeId: salary.employeeId,
      effectiveMonth,
      id: Not(salary.id),
    });

    if (taken) {
      throw salaryMonthExists(dto.effectiveMonth);
    }

    const before = await this.salaryRepository.find({ where: { employeeId: salary.employeeId } });

    await this.assertClosedMonthsUntouched(
      salary.employeeId,
      before,
      before.map((row) =>
        row.id.toLowerCase() === salary.id.toLowerCase() ? { ...dto, effectiveMonth } : row,
      ),
    );

    try {
      await this.audit.update(
        this.dataSource.manager,
        EmployeeSalaryEntity,
        { id: salary.id },
        {
          effectiveMonth,
          amount: dto.amount,
          currency: dto.currency,
          fixedPercent: dto.fixedPercent,
          kpiPercent: dto.kpiPercent,
        },
      );
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw salaryMonthExists(dto.effectiveMonth);
      }

      throw error;
    }

    return toEmployeeSalaryResponse(await this.salaryRepository.findOneByOrFail({ id: salary.id }));
  }

  async remove(id: string): Promise<void> {
    const salary = await this.findSalary(id);
    const before = await this.salaryRepository.find({ where: { employeeId: salary.employeeId } });

    await this.assertClosedMonthsUntouched(
      salary.employeeId,
      before,
      before.filter((row) => row.id.toLowerCase() !== salary.id.toLowerCase()),
    );

    await this.audit.delete(this.dataSource.manager, EmployeeSalaryEntity, { id: salary.id });
  }

  /**
   * Refuses a change that would alter the salary in force in a closed month the employee
   * has a KPI plan in: that month's pay is final (ADR-049). Reopening the period (within its
   * grace days, ADR-044) makes the correction possible.
   */
  private async assertClosedMonthsUntouched(
    employeeId: string,
    before: readonly SalaryFigures[],
    after: readonly SalaryFigures[],
  ): Promise<void> {
    const plans = await this.assignmentRepository.find({
      where: { employeeId },
      relations: { period: true },
    });
    const closedMonths = plans.flatMap((plan) =>
      plan.period && !isPeriodOpen(plan.period) ? [periodLabel(plan.period)] : [],
    );
    const changed = closedMonthsChanged(before, after, closedMonths);

    if (changed.length > 0) {
      throw salaryPeriodClosed(changed);
    }
  }

  private async findSalary(id: string): Promise<EmployeeSalaryEntity> {
    const salary = await this.salaryRepository.findOneBy({ id });

    if (!salary) {
      throw new NotFoundException('Salary not found.');
    }

    return salary;
  }

  private async assertEmployee(employeeId: string): Promise<void> {
    if (!(await this.employeeRepository.existsBy({ id: employeeId }))) {
      throw new NotFoundException('Employee not found.');
    }
  }
}

function assertPercents(dto: SaveEmployeeSalaryDto): void {
  if (!percentsAddUp(dto.fixedPercent, dto.kpiPercent)) {
    throw salaryPercentTotal();
  }
}
