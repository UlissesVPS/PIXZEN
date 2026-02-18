import api from '@/lib/api';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount: number | null;
  due_date: string;
  due_time: string | null;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  enabled: boolean;
  category: 'bill' | 'goal' | 'custom';
  advance_notification: 'none' | 'same_day' | '1_hour' | '1_day' | '2_days' | '1_week';
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReminderData {
  title: string;
  description?: string;
  amount?: number;
  due_date: string;
  due_time?: string;
  recurring?: Reminder['recurring'];
  category?: Reminder['category'];
  advance_notification?: Reminder['advance_notification'];
}

export interface UpdateReminderData {
  title?: string;
  description?: string;
  amount?: number | null;
  due_date?: string;
  due_time?: string | null;
  recurring?: Reminder['recurring'];
  enabled?: boolean;
  category?: Reminder['category'];
  advance_notification?: Reminder['advance_notification'];
}

export const remindersApi = {
  async list(params?: { enabled?: boolean; category?: string; completed?: boolean }): Promise<Reminder[]> {
    const { data } = await api.get('/reminders', { params });
    return data;
  },

  async getDue(): Promise<Reminder[]> {
    const { data } = await api.get('/reminders/due');
    return data;
  },

  async create(reminderData: CreateReminderData): Promise<Reminder> {
    const { data } = await api.post('/reminders', reminderData);
    return data;
  },

  async update(id: string, reminderData: UpdateReminderData): Promise<Reminder> {
    const { data } = await api.put(`/reminders/${id}`, reminderData);
    return data;
  },

  async complete(id: string): Promise<{ completed: Reminder; next?: Reminder }> {
    const { data } = await api.put(`/reminders/${id}/complete`);
    return data;
  },

  async toggle(id: string): Promise<Reminder> {
    const { data } = await api.put(`/reminders/${id}/toggle`);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },
};
