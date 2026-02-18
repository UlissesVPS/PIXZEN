import api from '@/lib/api';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  spent: number;
  actual_spent?: number;
  account_type: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetSummary {
  total_budgeted: number;
  total_spent: number;
  total_remaining: number;
  categories_over: number;
  categories_under: number;
}

export interface SpendingAnomaly {
  category_id: string;
  current_amount: number;
  previous_amount: number;
  increase_pct: number;
}

export interface SpendingProjection {
  projected_total: number;
  daily_average: number;
  days_elapsed: number;
  days_in_month: number;
  run_rate_warning: boolean;
}

export interface BudgetAlert {
  category_id: string;
  budgeted: number;
  spent: number;
  pct: number;
}

export interface MonthComparison {
  category_id: string;
  current: number;
  previous: number;
  change_pct: number;
}

export interface BillInfo {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
}

export interface GoalInfo {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  deadline: string | null;
  pct: number;
  days_left: number | null;
}

export interface Insights {
  anomalies: SpendingAnomaly[];
  projection: SpendingProjection;
  budget_alerts: BudgetAlert[];
  month_comparison: MonthComparison[];
  overdue_bills: BillInfo[];
  upcoming_bills: BillInfo[];
  goals_behind: GoalInfo[];
  top_categories: { category_id: string; total: number }[];
}

export const budgetApi = {
  async list(month?: string, accountType?: string): Promise<Budget[]> {
    const params: any = {};
    if (month) params.month = month;
    if (accountType) params.account_type = accountType;
    const { data } = await api.get('/budgets', { params });
    return data;
  },

  async getSummary(month?: string, accountType?: string): Promise<BudgetSummary> {
    const params: any = {};
    if (month) params.month = month;
    if (accountType) params.account_type = accountType;
    const { data } = await api.get('/budgets/summary', { params });
    return data;
  },

  async upsert(budget: { category_id: string; amount: number; month: string; account_type?: string }): Promise<Budget> {
    const { data } = await api.post('/budgets', budget);
    return data;
  },

  async upsertBatch(budgets: { category_id: string; amount: number; month: string; account_type?: string }[]): Promise<Budget[]> {
    const { data } = await api.post('/budgets/batch', { budgets });
    return data;
  },

  async copyPrevious(month: string, accountType?: string): Promise<Budget[]> {
    const { data } = await api.post('/budgets/copy-previous', { month, account_type: accountType });
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },

  async getInsights(accountType?: string): Promise<Insights> {
    const params: any = {};
    if (accountType) params.account_type = accountType;
    const { data } = await api.get('/budgets/insights', { params });

    // Transform backend format to frontend Insights format
    const raw = data as any;
    const insightsArray = raw.insights || [];
    const actions = raw.actions || {};
    const spending = raw.spending || {};

    // Extract anomalies from insights array
    const anomalies: SpendingAnomaly[] = insightsArray
      .filter((i: any) => i.type === 'anomaly')
      .map((i: any) => ({
        category_id: i.category || '',
        current_amount: i.current || 0,
        previous_amount: i.previous || 0,
        increase_pct: i.current && i.previous ? ((i.current - i.previous) / i.previous) * 100 : 0,
      }));

    // Extract budget alerts
    const budget_alerts: BudgetAlert[] = insightsArray
      .filter((i: any) => i.type === 'budget_exceeded' || i.type === 'budget_warning')
      .map((i: any) => ({
        category_id: i.category || '',
        budgeted: 0,
        spent: 0,
        pct: i.percentage || 0,
      }));

    // Extract month comparison
    const month_comparison: MonthComparison[] = insightsArray
      .filter((i: any) => i.type === 'comparison')
      .map((i: any) => ({
        category_id: 'total',
        current: spending.current_month || 0,
        previous: spending.previous_month || 0,
        change_pct: i.change || 0,
      }));

    // Build projection
    const dayOfMonth = spending.day_of_month || new Date().getDate();
    const daysInMonth = spending.days_in_month || 30;
    const projectionInsight = insightsArray.find((i: any) => i.type === 'projection');
    const projection: SpendingProjection = {
      projected_total: spending.projected || 0,
      daily_average: spending.daily_average || 0,
      days_elapsed: dayOfMonth,
      days_in_month: daysInMonth,
      run_rate_warning: !!projectionInsight,
    };

    // Top categories
    const top_categories = (spending.top_categories || []).map((c: any) => ({
      category_id: c.category_id,
      total: c.total || 0,
    }));

    return {
      anomalies,
      projection,
      budget_alerts,
      month_comparison,
      overdue_bills: [],
      upcoming_bills: [],
      goals_behind: [],
      top_categories,
    };
  },
};
