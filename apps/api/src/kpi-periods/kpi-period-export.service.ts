import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import { getBusinessTimeZone, getFirmNumber } from '../config/environment.js';
import { EmployeeSalaryEntity } from '../employee-salaries/entities/employee-salary.entity.js';
import {
  salaryInForce,
  salaryShare,
  splitSalary,
} from '../employee-salaries/employee-salary-rules.js';
import { toSalaryPayout } from '../employee-salaries/salary-payout.js';
import type { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { readKpiDefinitionName } from '../kpi-definitions/kpi-definition-response.js';
import { KpiAssignmentItemEntity } from '../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { KpiResultEntity } from '../kpi-results/entities/kpi-result.entity.js';
import type { TemplateLanguage } from '../store-visitor-counts/visitor-count-template.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { KpiPeriodEntity } from './entities/kpi-period.entity.js';
import {
  buildKpiPeriodExport,
  kpiExportFileName,
  type KpiExportItemRow,
  type KpiExportPlanRow,
} from './kpi-period-export.js';
import { isPeriodOpen, periodLabel } from './kpi-period-rules.js';

export interface KpiPeriodExportFile {
  content: Buffer;
  fileName: string;
}

/**
 * The Excel file of a KPI period (ADR-059): every plan with the employee, the stored score
 * and the salary in force in the month, plus each plan's KPI rows. Nothing is calculated
 * again; the file shows what the plans hold. Every download is logged on the period.
 */
@Injectable()
export class KpiPeriodExportService {
  constructor(
    @InjectRepository(KpiPeriodEntity)
    private readonly periodRepository: Repository<KpiPeriodEntity>,
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @InjectRepository(KpiAssignmentItemEntity)
    private readonly itemRepository: Repository<KpiAssignmentItemEntity>,
    @InjectRepository(KpiResultEntity)
    private readonly resultRepository: Repository<KpiResultEntity>,
    @InjectRepository(EmployeeSalaryEntity)
    private readonly salaryRepository: Repository<EmployeeSalaryEntity>,
    @InjectRepository(ErpEmployeeEntity)
    private readonly erpEmployeeRepository: Repository<ErpEmployeeEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async export(
    periodId: string,
    actor: EmployeeEntity,
    language: TemplateLanguage,
  ): Promise<KpiPeriodExportFile> {
    const period = await this.periodRepository.findOneBy({ id: periodId });

    if (!period) {
      throw new NotFoundException('KPI period not found.');
    }

    const label = periodLabel(period);
    const assignments = (
      await this.assignmentRepository.find({
        where: { periodId: period.id },
        relations: { employee: true },
      })
    ).filter((assignment) => assignment.employee);
    assignments.sort(
      (left, right) =>
        (left.employee?.firstname ?? '').localeCompare(right.employee?.firstname ?? '') ||
        (left.employee?.lastname ?? '').localeCompare(right.employee?.lastname ?? ''),
    );

    const assignmentIds = assignments.map((assignment) => assignment.id);
    const employees = assignments.flatMap((assignment) =>
      assignment.employee ? [assignment.employee] : [],
    );
    const [items, results, salaries, erpCodes, stores] = await Promise.all([
      this.loadItems(assignmentIds),
      this.loadResults(assignmentIds),
      this.loadSalaries(employees),
      this.loadErpCodes(employees),
      this.loadStores(employees),
    ]);

    const planRows: KpiExportPlanRow[] = [];
    const itemRows: KpiExportItemRow[] = [];

    for (const assignment of assignments) {
      const employee = assignment.employee as EmployeeEntity;
      const salary = salaryInForce(salaries.get(employee.id.toLowerCase()) ?? [], label);
      const planItems = items.get(assignment.id.toLowerCase()) ?? [];
      const erpCode = erpCodes.get(employee.erpEmployeeId ?? -1) ?? null;
      const kpiAmount = salary ? splitSalary(salary.amount, salary.fixedPercent).kpiAmount : null;
      let scored = 0;

      for (const item of planItems) {
        const result = results.get(item.id.toLowerCase());
        const weightedScore = result?.weightedScore ?? null;

        if (weightedScore !== null) {
          scored += 1;
        }

        itemRows.push({
          erpCode,
          firstname: employee.firstname,
          lastname: employee.lastname,
          kpiName: item.definition ? localized(item.definition, language) : '',
          weight: result?.weight ?? item.weight,
          unit: unitOf(item),
          targetValue: result?.targetValue ?? item.targetValue,
          actualValue: result?.actualValue ?? null,
          rawAchievement: result?.rawAchievement ?? null,
          cappedAchievement: result?.cappedAchievement ?? null,
          weightedScore,
          salaryValue: kpiAmount === null ? null : salaryShare(kpiAmount, item.weight),
          salaryEarned:
            kpiAmount === null || weightedScore === null
              ? null
              : salaryShare(kpiAmount, weightedScore),
        });
      }

      planRows.push({
        erpCode,
        firstname: employee.firstname,
        lastname: employee.lastname,
        username: employee.username,
        jobTitle: employee.jobTitle,
        storeName: storeName(stores, employee.defaultStoreId),
        templateName: assignment.templateName,
        totalScore: assignment.totalScore,
        scoredItemCount: scored,
        itemCount: planItems.length,
        salary: salary ? toSalaryPayout(salary, assignment.totalScore) : null,
      });
    }

    const calculatedAt = latest(assignments.map((assignment) => assignment.scoreCalculatedAt));
    const fileName = kpiExportFileName(label, actor.username);
    const content = await buildKpiPeriodExport(
      {
        periodLabel: label,
        isOpen: isPeriodOpen(period),
        exportedAt: formatBusinessTime(new Date()),
        exportedBy: `${actor.firstname} ${actor.lastname} (@${actor.username})`,
        calculatedAt: calculatedAt ? formatBusinessTime(calculatedAt) : null,
      },
      planRows,
      itemRows,
      language,
    );

    // Logged only once the file exists: who took the scores and salaries out, and when.
    await this.audit.logEvent(this.dataSource.manager, KpiPeriodEntity, period.id, 'export', {
      via: 'excel-export',
      fileName,
      planCount: planRows.length,
    });

    return { content, fileName };
  }

  /** Each plan's KPI rows in the plan's order, by lower-cased plan id. */
  private async loadItems(
    assignmentIds: string[],
  ): Promise<Map<string, KpiAssignmentItemEntity[]>> {
    const byPlan = new Map<string, KpiAssignmentItemEntity[]>();

    for (const ids of chunk(assignmentIds)) {
      const rows = await this.itemRepository.find({
        where: { assignmentId: In(ids) },
        relations: { definition: true },
        order: { sortOrder: 'ASC' },
      });

      for (const row of rows) {
        const key = row.assignmentId.toLowerCase();
        byPlan.set(key, [...(byPlan.get(key) ?? []), row]);
      }
    }

    return byPlan;
  }

  /** The stored result of each plan row, by lower-cased row id. */
  private async loadResults(assignmentIds: string[]): Promise<Map<string, KpiResultEntity>> {
    const byItem = new Map<string, KpiResultEntity>();

    for (const ids of chunk(assignmentIds)) {
      const rows = await this.resultRepository.findBy({ assignmentId: In(ids) });

      for (const row of rows) {
        byItem.set(row.assignmentItemId.toLowerCase(), row);
      }
    }

    return byItem;
  }

  /** Every salary of the employees, by lower-cased employee id; the month picks one. */
  private async loadSalaries(
    employees: EmployeeEntity[],
  ): Promise<Map<string, EmployeeSalaryEntity[]>> {
    const byEmployee = new Map<string, EmployeeSalaryEntity[]>();

    for (const ids of chunk(employees.map((employee) => employee.id))) {
      const rows = await this.salaryRepository.findBy({ employeeId: In(ids) });

      for (const row of rows) {
        const key = row.employeeId.toLowerCase();
        byEmployee.set(key, [...(byEmployee.get(key) ?? []), row]);
      }
    }

    return byEmployee;
  }

  private async loadErpCodes(employees: EmployeeEntity[]): Promise<Map<number, string | null>> {
    const ids = unique(employees.map((employee) => employee.erpEmployeeId));

    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.erpEmployeeRepository.find({
      select: { id: true, code: true },
      where: { id: In(ids) },
    });

    return new Map(rows.map((row) => [row.id, row.code]));
  }

  private async loadStores(employees: EmployeeEntity[]): Promise<Map<number, StoreEntity>> {
    const ids = unique(employees.map((employee) => employee.defaultStoreId));

    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.storeRepository.findBy({ id: In(ids), firmNr: getFirmNumber() });

    return new Map(rows.map((store) => [store.id, store]));
  }
}

/** SQL Server takes at most 2,100 parameters per statement. */
function chunk(ids: string[], size = 1_000): string[][] {
  const chunks: string[][] = [];

  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }

  return chunks;
}

function unique(values: (number | null)[]): number[] {
  return [...new Set(values.filter((value): value is number => value !== null))];
}

function localized(
  definition: NonNullable<KpiAssignmentItemEntity['definition']>,
  language: TemplateLanguage,
): string {
  const name = readKpiDefinitionName(definition);

  return name[language] ?? name.tr;
}

/** Money KPIs carry their currency in the plan row's inputs; percents show `%`. */
function unitOf(item: KpiAssignmentItemEntity): string {
  const unit = item.definition?.unit;

  if (unit === 'percent') {
    return '%';
  }

  if (unit !== 'money') {
    return '';
  }

  try {
    const inputs = JSON.parse(item.inputValues) as { currency?: unknown };

    return typeof inputs.currency === 'string' ? inputs.currency : '';
  } catch {
    return '';
  }
}

function storeName(stores: Map<number, StoreEntity>, storeId: number | null): string | null {
  if (storeId === null) {
    return null;
  }

  const store = stores.get(storeId);

  return store?.name ?? (store ? String(store.nr) : null);
}

function latest(dates: (Date | null)[]): Date | null {
  return dates.reduce<Date | null>(
    (newest, date) => (date && (!newest || date > newest) ? date : newest),
    null,
  );
}

/** `2026-09-28 17:30` in the business time zone, the clock the stores live by. */
function formatBusinessTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: getBusinessTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}`;
}
