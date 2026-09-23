import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { KpiAssignmentItemEntity } from '../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { toKpiAssignmentPeriod } from '../kpi-assignments/kpi-assignment-response.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { periodOrder } from '../kpi-periods/kpi-period-rules.js';
import { KpiAutoCalculationService } from '../kpi-results/kpi-auto-calculation.service.js';
import type { LeaderboardQueryDto } from './dto/leaderboard-query.dto.js';
import type {
  LeaderboardEmployeeResponse,
  LeaderboardEntryResponse,
  LeaderboardResponse,
  LeaderboardTemplateResponse,
} from './leaderboard-response.js';
import { rankEntries } from './leaderboard-rules.js';

/**
 * The leaderboard (ADR-047): every plan of a period ranked by the total score the
 * calculation stored (ADR-041). Nothing is calculated here; the scores come ready from
 * `kpi_assignments`, which the scheduled recalculation keeps current.
 */
@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(KpiPeriodEntity)
    private readonly periodRepository: Repository<KpiPeriodEntity>,
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @InjectRepository(KpiAssignmentItemEntity)
    private readonly itemRepository: Repository<KpiAssignmentItemEntity>,
    @Inject(KpiAutoCalculationService)
    private readonly autoCalculation: KpiAutoCalculationService,
  ) {}

  async get(query: LeaderboardQueryDto, requesterId: string): Promise<LeaderboardResponse> {
    const periods = await this.periodsWithPlans();
    const period = this.pickPeriod(periods, query.periodId);
    const autoCalculation = this.autoCalculation.status();

    if (!period) {
      return {
        period: null,
        periods: [],
        templates: [],
        calculatedAt: null,
        autoCalculation,
        entries: [],
      };
    }

    const assignments = await this.assignmentRepository.find({
      where: { periodId: period.id },
      relations: { employee: { avatar: true } },
    });
    const templates = toTemplates(assignments);
    const shown = query.templateId
      ? assignments.filter(
          (assignment) => assignment.templateId.toLowerCase() === query.templateId?.toLowerCase(),
        )
      : assignments;
    const itemCounts = await this.countItems(shown.map((assignment) => assignment.id));
    const me = requesterId.toLowerCase();
    const entries: LeaderboardEntryResponse[] = rankEntries(
      shown.flatMap((assignment) => {
        const employee = assignment.employee;

        return employee
          ? [
              {
                assignmentId: assignment.id,
                employee: toLeaderboardEmployee(employee),
                templateId: assignment.templateId,
                templateName: assignment.templateName,
                totalScore: assignment.totalScore,
                scoredItemCount: assignment.scoredItemCount ?? 0,
                itemCount: itemCounts.get(assignment.id.toLowerCase()) ?? 0,
                isMe: employee.id.toLowerCase() === me,
              },
            ]
          : [];
      }),
    );

    return {
      period: toKpiAssignmentPeriod(period),
      periods: periods.map(toKpiAssignmentPeriod),
      templates,
      calculatedAt: latest(assignments.map((assignment) => assignment.scoreCalculatedAt)),
      autoCalculation,
      entries,
    };
  }

  /** Periods that have at least one plan, newest first; one per month, so the list is short. */
  private async periodsWithPlans(): Promise<KpiPeriodEntity[]> {
    const periods = await this.periodRepository
      .createQueryBuilder('period')
      .where(
        'EXISTS (SELECT 1 FROM [dbo].[kpi_assignments] [a] WHERE [a].[period_id] = [period].[id])',
      )
      .getMany();

    return periods.sort((left, right) => periodOrder(right) - periodOrder(left));
  }

  /** The asked period, else this month's, else the newest one with plans. */
  private pickPeriod(
    periods: KpiPeriodEntity[],
    periodId: string | undefined,
  ): KpiPeriodEntity | undefined {
    if (periodId) {
      const asked = periods.find((period) => period.id.toLowerCase() === periodId.toLowerCase());

      if (!asked) {
        throw new NotFoundException('KPI period not found or it has no plans.');
      }

      return asked;
    }

    const now = new Date();
    const thisMonth = periodOrder({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 });

    return periods.find((period) => periodOrder(period) === thisMonth) ?? periods[0];
  }

  private async countItems(assignmentIds: string[]): Promise<Map<string, number>> {
    if (assignmentIds.length === 0) {
      return new Map();
    }

    const rows = await this.itemRepository
      .createQueryBuilder('item')
      .select('item.assignmentId', 'assignmentId')
      .addSelect('COUNT(*)', 'itemCount')
      .where('item.assignmentId IN (:...ids)', { ids: assignmentIds })
      .groupBy('item.assignmentId')
      .getRawMany<{ assignmentId: string; itemCount: number }>();

    return new Map(rows.map((row) => [row.assignmentId.toLowerCase(), Number(row.itemCount)]));
  }
}

function toLeaderboardEmployee(employee: EmployeeEntity): LeaderboardEmployeeResponse {
  const avatar = employee.avatar;

  return {
    id: employee.id,
    firstname: employee.firstname,
    lastname: employee.lastname,
    avatarUrl: avatar
      ? `/files/${avatar.id}/content?variant=${avatar.smallImage ? 'small' : 'original'}`
      : null,
  };
}

/** The templates the period's plans came from, by name; the screen's filter chips. */
function toTemplates(assignments: KpiAssignmentEntity[]): LeaderboardTemplateResponse[] {
  const byId = new Map<string, LeaderboardTemplateResponse>();

  for (const assignment of assignments) {
    const key = assignment.templateId.toLowerCase();
    const template = byId.get(key);

    if (template) {
      template.planCount += 1;
    } else {
      byId.set(key, { id: assignment.templateId, name: assignment.templateName, planCount: 1 });
    }
  }

  return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function latest(dates: (Date | null)[]): Date | null {
  return dates.reduce<Date | null>(
    (newest, date) => (date && (!newest || date > newest) ? date : newest),
    null,
  );
}
