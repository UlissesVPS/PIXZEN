import api from '@/lib/api';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  category: string;
  icon: string;
  color: string;
  deadline: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  category?: string;
  icon?: string;
  color?: string;
  deadline?: string;
}

export interface UpdateGoalData {
  title?: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  category?: string;
  icon?: string;
  color?: string;
  deadline?: string | null;
}

export interface DepositResult {
  goal: Goal;
  deposit: number;
  target_reached: boolean;
  remaining: number;
}

export interface WithdrawResult {
  goal: Goal;
  withdrawn: number;
  remaining: number;
}

export const goalsApi = {
  async list(params?: { completed?: boolean; category?: string }): Promise<Goal[]> {
    const { data } = await api.get('/goals', { params });
    return data;
  },

  async getById(id: string): Promise<Goal> {
    const { data } = await api.get(`/goals/${id}`);
    return data;
  },

  async create(goalData: CreateGoalData): Promise<Goal> {
    const { data } = await api.post('/goals', goalData);
    return data;
  },

  async update(id: string, goalData: UpdateGoalData): Promise<Goal> {
    const { data } = await api.put(`/goals/${id}`, goalData);
    return data;
  },

  async deposit(id: string, amount: number): Promise<DepositResult> {
    const { data } = await api.post(`/goals/${id}/deposit`, { amount });
    return data;
  },

  async withdraw(id: string, amount: number): Promise<WithdrawResult> {
    const { data } = await api.post(`/goals/${id}/withdraw`, { amount });
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/goals/${id}`);
  },
};
