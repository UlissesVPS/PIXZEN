import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { remindersApi, Reminder as ApiReminder, CreateReminderData } from '@/services/remindersApi';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'alert' | 'info';
  date: Date;
  read: boolean;
  scheduledFor?: Date;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  amount?: number;
  dueDate: Date;
  dueTime?: string;
  recurring: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  enabled: boolean;
  category: 'bill' | 'goal' | 'custom';
  advanceNotification: 'none' | 'same_day' | '1_hour' | '1_day' | '2_days' | '1_week';
  completed?: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  reminders: Reminder[];
  unreadCount: number;
  loading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  loadReminders: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// Helper: convert API reminder (snake_case) to frontend Reminder (camelCase)
function apiToFrontend(r: ApiReminder): Reminder {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    amount: r.amount ? Number(r.amount) : undefined,
    dueDate: new Date(r.due_date),
    dueTime: r.due_time || undefined,
    recurring: r.recurring as Reminder['recurring'],
    enabled: r.enabled,
    category: r.category as Reminder['category'],
    advanceNotification: r.advance_notification as Reminder['advanceNotification'],
    completed: r.completed,
  };
}

// Helper: convert frontend data to API format
function frontendToApi(r: Omit<Reminder, 'id'>): CreateReminderData {
  return {
    title: r.title,
    description: r.description || '',
    amount: r.amount,
    due_date: r.dueDate instanceof Date ? r.dueDate.toISOString() : String(r.dueDate),
    due_time: r.dueTime || undefined,
    recurring: r.recurring,
    category: r.category,
    advance_notification: r.advanceNotification,
  };
}

// Initial welcome notification
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'Bem-vindo ao PixZen!',
    message: 'Configure suas categorias e comece a registrar suas transações.',
    type: 'info',
    date: new Date(),
    read: false,
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);

  // Get auth context - NotificationsProvider is inside AuthProvider in App.tsx
  const { user, isDemoMode } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load reminders from API
  const loadReminders = useCallback(async () => {
    if (!user || isDemoMode) return;
    try {
      setLoading(true);
      const data = await remindersApi.list({ completed: false });
      setReminders(data.map(apiToFrontend));
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load reminders on mount and when user changes
  useEffect(() => {
    if (user) {
      loadReminders();
    } else {
      setReminders([]);
    }
  }, [user, loadReminders]);

  // Check for due reminders every 60 seconds
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      reminders.forEach(reminder => {
        if (!reminder.enabled || reminder.completed) return;

        const dueDate = new Date(reminder.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff <= 1 && daysDiff >= 0) {
          const existingNotification = notifications.find(
            n => n.title.includes(reminder.title) &&
            new Date(n.date).toDateString() === now.toDateString()
          );

          if (!existingNotification) {
            addNotification({
              title: `${reminder.title} vence ${daysDiff === 0 ? 'hoje' : 'amanha'}`,
              message: reminder.amount
                ? `Lembrete: ${reminder.description} no valor de R$ ${reminder.amount.toFixed(2)}.`
                : `Lembrete: ${reminder.description}`,
              type: 'reminder',
              date: now,
            });
          }
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  // Polling reminders every 30s
  useEffect(() => {
    if (!user || isDemoMode) return;
    const interval = setInterval(loadReminders, 30000);
    return () => clearInterval(interval);
  }, [user, loadReminders]);

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);

    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addReminder = async (reminder: Omit<Reminder, 'id'>) => {
    if (!user) {
      // Demo mode: local only
      const newReminder: Reminder = { ...reminder, id: Date.now().toString() };
      setReminders(prev => [...prev, newReminder]);
      toast({ title: 'Lembrete criado!', description: `"${reminder.title}" foi adicionado.` });
      return;
    }

    try {
      const apiData = frontendToApi(reminder);
      const created = await remindersApi.create(apiData);
      setReminders(prev => [...prev, apiToFrontend(created)]);

      toast({
        title: 'Lembrete criado!',
        description: `"${reminder.title}" foi adicionado aos seus lembretes.`,
      });
    } catch (error) {
      console.error('Failed to create reminder:', error);
      toast({
        title: 'Erro ao criar lembrete',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    if (!user) {
      setReminders(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
      return;
    }

    try {
      const apiUpdates: any = {};
      if (updates.title !== undefined) apiUpdates.title = updates.title;
      if (updates.description !== undefined) apiUpdates.description = updates.description;
      if (updates.amount !== undefined) apiUpdates.amount = updates.amount;
      if (updates.dueDate !== undefined) apiUpdates.due_date = updates.dueDate instanceof Date ? updates.dueDate.toISOString() : String(updates.dueDate);
      if (updates.dueTime !== undefined) apiUpdates.due_time = updates.dueTime;
      if (updates.recurring !== undefined) apiUpdates.recurring = updates.recurring;
      if (updates.enabled !== undefined) apiUpdates.enabled = updates.enabled;
      if (updates.category !== undefined) apiUpdates.category = updates.category;
      if (updates.advanceNotification !== undefined) apiUpdates.advance_notification = updates.advanceNotification;

      const updated = await remindersApi.update(id, apiUpdates);
      setReminders(prev => prev.map(r => (r.id === id ? apiToFrontend(updated) : r)));
    } catch (error) {
      console.error('Failed to update reminder:', error);
      toast({ title: 'Erro ao atualizar lembrete', variant: 'destructive' });
    }
  };

  const deleteReminder = async (id: string) => {
    if (!user) {
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Lembrete removido' });
      return;
    }

    try {
      await remindersApi.delete(id);
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Lembrete removido' });
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      toast({ title: 'Erro ao remover lembrete', variant: 'destructive' });
    }
  };

  const toggleReminder = async (id: string) => {
    if (!user) {
      setReminders(prev => prev.map(r => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
      return;
    }

    try {
      const toggled = await remindersApi.toggle(id);
      setReminders(prev => prev.map(r => (r.id === id ? apiToFrontend(toggled) : r)));
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
      toast({ title: 'Erro ao alterar lembrete', variant: 'destructive' });
    }
  };

  const completeReminder = async (id: string) => {
    if (!user) {
      setReminders(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Lembrete concluido!' });
      return;
    }

    try {
      const result = await remindersApi.complete(id);
      // Remove completed, add next if recurring
      setReminders(prev => {
        let updated = prev.filter(r => r.id !== id);
        if (result.next) {
          updated = [...updated, apiToFrontend(result.next)];
        }
        return updated;
      });

      toast({
        title: 'Lembrete concluido!',
        description: result.next ? 'Proxima ocorrencia criada automaticamente.' : undefined,
      });
    } catch (error) {
      console.error('Failed to complete reminder:', error);
      toast({ title: 'Erro ao concluir lembrete', variant: 'destructive' });
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        reminders,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminder,
        completeReminder,
        loadReminders,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
