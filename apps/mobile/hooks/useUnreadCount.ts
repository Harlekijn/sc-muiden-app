import { useNotifications } from './useNotifications';

export function useUnreadCount() {
  const { data: notifications } = useNotifications();

  return (notifications ?? []).filter((n) => !n.read_at).length;
}

export function useUnreadAnnouncementCount() {
  const { data: notifications } = useNotifications();

  return (notifications ?? []).filter((n) => !n.read_at && n.type === 'aankondiging').length;
}
