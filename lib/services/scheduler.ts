// Stub — will be replaced in GREEN phase
export interface AvailabilityRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  rule_type: 'available' | 'blocked' | 'preferred';
}

export interface SchedulableTask {
  id: string;
  title: string;
  course_id: string;
  due_date: string | null;
  estimated_minutes: number;
  status: 'todo' | 'doing';
}

export interface PlannerSettings {
  max_block_minutes: number;
  min_block_minutes: number;
  buffer_minutes: number;
}

export interface ScheduledBlock {
  task_id: string;
  start_time: Date;
  end_time: Date;
}

export interface SchedulerResult {
  blocks: ScheduledBlock[];
  unscheduled: SchedulableTask[];
  risk_tasks: Array<{ task: SchedulableTask; level: 'at_risk' | 'overdue_risk' }>;
}

export function generateSchedule(
  _tasks: SchedulableTask[],
  _availabilityRules: AvailabilityRule[],
  _settings: PlannerSettings,
  _userTimezone: string,
  _planStart: Date,
): SchedulerResult {
  throw new Error('Not implemented');
}
