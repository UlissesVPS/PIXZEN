import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: number;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered:', reg);
          setRegistration(reg);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'Notificações não suportadas',
        description: 'Seu navegador não suporta notificações push.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notificações ativadas!',
          description: 'Você receberá lembretes mesmo fora do app.',
        });
        return true;
      } else if (result === 'denied') {
        toast({
          title: 'Notificações bloqueadas',
          description: 'Permita notificações nas configurações do navegador.',
          variant: 'destructive',
        });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, body: string, tag?: string) => {
    if (permission !== 'granted' || !registration) {
      console.log('Cannot show notification: permission not granted or no registration');
      return;
    }

    // Use service worker to show notification (works even when app is closed)
    registration.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      tag,
    });
  }, [permission, registration]);

  const scheduleNotification = useCallback((notification: ScheduledNotification) => {
    if (permission !== 'granted') {
      console.log('Cannot schedule notification: permission not granted');
      return;
    }

    const delay = notification.scheduledTime - Date.now();
    
    if (delay <= 0) {
      // Show immediately if time has passed
      showNotification(notification.title, notification.body, `reminder-${notification.id}`);
      return;
    }

    // Store in localStorage for persistence
    const stored = localStorage.getItem('scheduledNotifications');
    const notifications: ScheduledNotification[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing notification with same ID
    const filtered = notifications.filter(n => n.id !== notification.id);
    filtered.push(notification);
    localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));

    // Schedule using setTimeout (for current session)
    setTimeout(() => {
      showNotification(notification.title, notification.body, `reminder-${notification.id}`);
      
      // Remove from storage after showing
      const current = localStorage.getItem('scheduledNotifications');
      if (current) {
        const list: ScheduledNotification[] = JSON.parse(current);
        const updated = list.filter(n => n.id !== notification.id);
        localStorage.setItem('scheduledNotifications', JSON.stringify(updated));
      }
    }, delay);

    console.log(`Notification scheduled for ${new Date(notification.scheduledTime).toLocaleString()}`);
  }, [permission, showNotification]);

  const cancelNotification = useCallback((id: string) => {
    const stored = localStorage.getItem('scheduledNotifications');
    if (stored) {
      const notifications: ScheduledNotification[] = JSON.parse(stored);
      const filtered = notifications.filter(n => n.id !== id);
      localStorage.setItem('scheduledNotifications', JSON.stringify(filtered));
    }
  }, []);

  // Check and reschedule notifications on mount
  useEffect(() => {
    if (permission === 'granted' && registration) {
      const stored = localStorage.getItem('scheduledNotifications');
      if (stored) {
        const notifications: ScheduledNotification[] = JSON.parse(stored);
        const now = Date.now();
        
        notifications.forEach(notification => {
          if (notification.scheduledTime > now) {
            const delay = notification.scheduledTime - now;
            setTimeout(() => {
              showNotification(notification.title, notification.body, `reminder-${notification.id}`);
              
              // Remove from storage
              const current = localStorage.getItem('scheduledNotifications');
              if (current) {
                const list: ScheduledNotification[] = JSON.parse(current);
                const updated = list.filter(n => n.id !== notification.id);
                localStorage.setItem('scheduledNotifications', JSON.stringify(updated));
              }
            }, delay);
          }
        });
        
        // Clean up past notifications
        const future = notifications.filter(n => n.scheduledTime > now);
        localStorage.setItem('scheduledNotifications', JSON.stringify(future));
      }
    }
  }, [permission, registration, showNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    scheduleNotification,
    cancelNotification,
  };
}
