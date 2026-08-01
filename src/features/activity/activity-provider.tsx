import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { supabaseActivityRepository } from '@/src/data/supabase-activity-repository';
import { useAuth } from '@/src/features/auth/auth-provider';
import type { ActivityNotification } from './types';

type ActivityContextValue = {
  error?: string;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  notifications: readonly ActivityNotification[];
  unreadCount: number;
  loadMore: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const PAGE_SIZE = 25;
const ActivityContext = createContext<ActivityContextValue | null>(null);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Activity could not be loaded. Please try again.';
}

function appendUnique(current: readonly ActivityNotification[], incoming: readonly ActivityNotification[]) {
  const ids = new Set(current.map((notification) => notification.id));
  return [...current, ...incoming.filter((notification) => !ids.has(notification.id))];
}

export function ActivityProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string>();
  const [unreadCount, setUnreadCount] = useState(0);
  const loadingMoreRef = useRef(false);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const refresh = useCallback(async () => {
    if (!userId) return;
    const requestedUserId = userId;
    setIsLoading(true);
    try {
      const [page, unread] = await Promise.all([
        supabaseActivityRepository.list(PAGE_SIZE),
        supabaseActivityRepository.countUnread(),
      ]);
      if (userIdRef.current !== requestedUserId) return;
      setNotifications([...page.items]);
      setCursor(page.nextCursor);
      setUnreadCount(unread);
      setError(undefined);
    } catch (caught) {
      if (userIdRef.current === requestedUserId) setError(errorMessage(caught));
    } finally {
      if (userIdRef.current === requestedUserId) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setNotifications([]);
    setCursor(undefined);
    setIsLoading(false);
    setIsLoadingMore(false);
    setError(undefined);
    setUnreadCount(0);
    loadingMoreRef.current = false;
    if (!userId) return;
    void refresh();
  }, [refresh, userId]);

  const loadMore = useCallback(async () => {
    if (!userId || !cursor || loadingMoreRef.current) return;
    const requestedUserId = userId;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const page = await supabaseActivityRepository.list(PAGE_SIZE, cursor);
      if (userIdRef.current !== requestedUserId) return;
      setNotifications((current) => appendUnique(current, page.items));
      setCursor(page.nextCursor);
      setError(undefined);
    } catch (caught) {
      if (userIdRef.current === requestedUserId) setError(errorMessage(caught));
    } finally {
      loadingMoreRef.current = false;
      if (userIdRef.current === requestedUserId) setIsLoadingMore(false);
    }
  }, [cursor, userId]);

  const markRead = useCallback(async (notificationId: string) => {
    const existing = notifications.find((notification) => notification.id === notificationId);
    if (!existing || existing.readAt) return;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => notification.id === notificationId ? { ...notification, readAt } : notification));
    setUnreadCount((current) => Math.max(0, current - 1));
    try {
      await supabaseActivityRepository.markRead(notificationId);
      setError(undefined);
    } catch (caught) {
      setNotifications((current) => current.map((notification) => notification.id === notificationId ? existing : notification));
      setUnreadCount((current) => current + 1);
      setError(errorMessage(caught));
      throw caught;
    }
  }, [notifications]);

  const markAllRead = useCallback(async () => {
    const previous = notifications;
    const previousUnreadCount = unreadCount;
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => notification.readAt ? notification : { ...notification, readAt }));
    setUnreadCount(0);
    try {
      await supabaseActivityRepository.markAllRead();
      setError(undefined);
    } catch (caught) {
      setNotifications(previous);
      setUnreadCount(previousUnreadCount);
      setError(errorMessage(caught));
      throw caught;
    }
  }, [notifications, unreadCount]);

  const value = useMemo<ActivityContextValue>(() => ({
    error,
    hasMore: Boolean(cursor),
    isLoading,
    isLoadingMore,
    loadMore,
    markAllRead,
    markRead,
    notifications,
    refresh,
    unreadCount,
  }), [cursor, error, isLoading, isLoadingMore, loadMore, markAllRead, markRead, notifications, refresh, unreadCount]);

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const value = useContext(ActivityContext);
  if (!value) throw new Error('useActivity must be used inside ActivityProvider.');
  return value;
}
