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
    return data;
  },
};
