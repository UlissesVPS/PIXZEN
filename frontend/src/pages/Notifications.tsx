import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Check, CheckCheck, Plus, Trash2, Calendar, Repeat, DollarSign, Clock, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications, Reminder } from '@/contexts/NotificationsContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    reminders,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addReminder,
    deleteReminder,
    toggleReminder,
  } = useNotifications();

  const { permission, isSupported, requestPermission, scheduleNotification } = usePushNotifications();

  const [activeTab, setActiveTab] = useState<'notifications' | 'reminders'>('notifications');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    recurring: 'none' as Reminder['recurring'],
    category: 'custom' as Reminder['category'],
    advanceNotification: 'same_day' as Reminder['advanceNotification'],
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / 86400000);

    if (diffDays < 0) return 'Vencido';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays <= 7) return `Em ${diffDays} dias`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.dueDate) return;

    const dueDateTime = new Date(`${newReminder.dueDate}T${newReminder.dueTime || '09:00'}`);
    const reminderId = Date.now().toString();

    // Create the reminder first (non-blocking)
    await addReminder({
      title: newReminder.title,
      description: newReminder.description,
      amount: newReminder.amount ? parseFloat(newReminder.amount) : undefined,
      dueDate: dueDateTime,
      dueTime: newReminder.dueTime,
      recurring: newReminder.recurring,
      enabled: true,
      category: newReminder.category,
      advanceNotification: newReminder.advanceNotification,
    });

    // Request push permission in background (non-blocking for reminder creation)
    if (permission !== 'granted' && isSupported) {
      requestPermission().then((granted) => {
        if (!granted) {
          toast({
            title: 'Atenção',
            description: 'Sem permissão push, você só receberá notificações com o app aberto.',
            variant: 'destructive',
          });
        }
      }).catch(() => {});
    }

    // Schedule push notification (only works if permission is granted)
    scheduleReminderNotification(reminderId, newReminder.title, newReminder.description, dueDateTime, newReminder.advanceNotification);

    setNewReminder({
      title: '',
      description: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '09:00',
      recurring: 'none',
      category: 'custom',
      advanceNotification: 'same_day',
    });
    setShowAddReminder(false);
  };

  const scheduleReminderNotification = (
    id: string, 
    title: string, 
    description: string, 
    dueDate: Date, 
    advance: Reminder['advanceNotification']
  ) => {
    const now = Date.now();
    let notificationTime = dueDate.getTime();

    // Calculate advance notification time
    switch (advance) {
      case '1_hour':
        notificationTime -= 60 * 60 * 1000;
        break;
      case '1_day':
        notificationTime -= 24 * 60 * 60 * 1000;
        break;
      case '2_days':
        notificationTime -= 2 * 24 * 60 * 60 * 1000;
        break;
      case '1_week':
        notificationTime -= 7 * 24 * 60 * 60 * 1000;
        break;
      case 'same_day':
      case 'none':
      default:
        // Keep the original time
        break;
    }

    if (notificationTime > now) {
      scheduleNotification({
        id,
        title: `⏰ ${title}`,
        body: description || 'Você tem um lembrete!',
        scheduledTime: notificationTime,
      });
    }

    // Also schedule for exact time if advance is set
    if (advance !== 'none' && advance !== 'same_day' && dueDate.getTime() > now) {
      scheduleNotification({
        id: `${id}-exact`,
        title: `🔔 ${title} - Agora!`,
        body: description || 'Este é o momento do seu lembrete!',
        scheduledTime: dueDate.getTime(),
      });
    }
  };

  const getAdvanceLabel = (advance: string) => {
    switch (advance) {
      case '1_hour': return '1h antes';
      case '1_day': return '1 dia antes';
      case '2_days': return '2 dias antes';
      case '1_week': return '1 semana antes';
      case 'same_day': return 'No horário';
      default: return 'No horário';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return '⏰';
      case 'alert':
        return '🎉';
      default:
        return '💡';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bill':
        return '📄';
      case 'goal':
        return '🎯';
      default:
        return '📌';
    }
  };

  const getRecurringLabel = (recurring: string) => {
    switch (recurring) {
      case 'daily':
        return 'Diário';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensal';
      default:
        return 'Único';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-semibold ml-2 md:ml-0">Notificações</h1>
              {unreadCount > 0 && (
                <span className="ml-2 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {activeTab === 'notifications' && notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
            {activeTab === 'reminders' && (
              <Button variant="ghost" size="sm" onClick={() => setShowAddReminder(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Novo
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-2xl mx-auto space-y-4">
            {/* Push Notification Permission Banner */}
            {isSupported && permission !== 'granted' && activeTab === 'reminders' && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                <BellRing className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ative notificações push</p>
                  <p className="text-xs text-muted-foreground">Receba lembretes mesmo com o app fechado</p>
                </div>
                <Button size="sm" onClick={requestPermission}>
                  Ativar
                </Button>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-secondary rounded-xl p-1 flex">
              <button
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'notifications'
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Bell className="h-4 w-4" />
                Notificações
              </button>
              <button
                onClick={() => setActiveTab('reminders')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeTab === 'reminders'
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="h-4 w-4" />
                Lembretes
              </button>
            </div>

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <BellOff className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">Nenhuma notificação</p>
                    <p className="text-sm">Você está em dia!</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "bg-card rounded-xl p-4 border border-border transition-all",
                        !notification.read && "border-primary/30 bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">{notification.title}</h3>
                            {!notification.read && (
                              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">{formatDate(notification.date)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <div className="space-y-3">
                {reminders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Calendar className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">Nenhum lembrete</p>
                    <p className="text-sm">Crie lembretes para não esquecer suas contas</p>
                    <Button className="mt-4" onClick={() => setShowAddReminder(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Lembrete
                    </Button>
                  </div>
                ) : (
                  <>
                    {reminders.map((reminder) => {
                      const dueDate = new Date(reminder.dueDate);
                      const isOverdue = dueDate < new Date();

                      return (
                        <div
                          key={reminder.id}
                          className={cn(
                            "bg-card rounded-xl p-4 border border-border transition-all",
                            !reminder.enabled && "opacity-50",
                            isOverdue && reminder.enabled && "border-destructive/30"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{getCategoryIcon(reminder.category)}</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{reminder.title}</h3>
                              <p className="text-sm text-muted-foreground">{reminder.description}</p>
                              <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                <span className={cn(isOverdue && reminder.enabled && "text-destructive font-medium")}>
                                  {formatDueDate(reminder.dueDate)}
                                </span>
                                {reminder.dueTime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {reminder.dueTime}
                                  </span>
                                )}
                                {reminder.amount && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    R$ {reminder.amount.toFixed(2)}
                                  </span>
                                )}
                                {reminder.recurring !== 'none' && (
                                  <span className="flex items-center gap-1">
                                    <Repeat className="h-3 w-3" />
                                    {getRecurringLabel(reminder.recurring)}
                                  </span>
                                )}
                                {reminder.advanceNotification && reminder.advanceNotification !== 'same_day' && (
                                  <span className="flex items-center gap-1 text-primary">
                                    <BellRing className="h-3 w-3" />
                                    {getAdvanceLabel(reminder.advanceNotification)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={reminder.enabled}
                                onCheckedChange={() => toggleReminder(reminder.id)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteReminder(reminder.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAddReminder(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Lembrete
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddReminder} onOpenChange={setShowAddReminder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Novo Lembrete
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                placeholder="Ex: Conta de luz"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                placeholder="Ex: Pagar até o vencimento"
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    placeholder="0,00"
                    className="pl-10"
                    value={newReminder.amount}
                    onChange={(e) => setNewReminder({ ...newReminder, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={newReminder.dueDate}
                  onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Horário</label>
                <Input
                  type="time"
                  value={newReminder.dueTime}
                  onChange={(e) => setNewReminder({ ...newReminder, dueTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BellRing className="h-4 w-4" />
                Notificar com antecedência
              </label>
              <Select
                value={newReminder.advanceNotification}
                onValueChange={(value: Reminder['advanceNotification']) => 
                  setNewReminder({ ...newReminder, advanceNotification: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_day">🔔 No horário exato</SelectItem>
                  <SelectItem value="1_hour">⏰ 1 hora antes</SelectItem>
                  <SelectItem value="1_day">📅 1 dia antes</SelectItem>
                  <SelectItem value="2_days">📆 2 dias antes</SelectItem>
                  <SelectItem value="1_week">🗓️ 1 semana antes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={newReminder.category}
                  onValueChange={(value: Reminder['category']) => 
                    setNewReminder({ ...newReminder, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill">📄 Conta</SelectItem>
                    <SelectItem value="goal">🎯 Meta</SelectItem>
                    <SelectItem value="custom">📌 Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Repetição</label>
                <Select
                  value={newReminder.recurring}
                  onValueChange={(value: Reminder['recurring']) => 
                    setNewReminder({ ...newReminder, recurring: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Único</SelectItem>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" onClick={handleAddReminder}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Lembrete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
