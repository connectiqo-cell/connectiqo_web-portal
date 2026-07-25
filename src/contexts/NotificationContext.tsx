"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { notificationApi, type Notification } from "@/lib/api/notificationApi";
import { createClient } from "@/lib/supabase/client";

const readIdsStorageKey = (userId: string) => `notification_read_ids_${userId}`;

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  isRead: (id: string) => boolean;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Web port of connectfront/src/contexts/NotificationContext.js. Mobile only
 * ever tracked an in-memory/AsyncStorage-persisted unread counter — it never
 * had a push backend. This keeps that same "derived from bookings, read
 * state persisted locally" model, but adds a Realtime subscription so the
 * feed updates live instead of only on next app open.
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      void Promise.resolve().then(() => setReadIds(new Set()));
      return;
    }
    void Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(readIdsStorageKey(user.id));
        const ids = raw ? JSON.parse(raw) : [];
        setReadIds(new Set(Array.isArray(ids) ? ids : []));
      } catch {
        setReadIds(new Set());
      }
    });
  }, [user]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await notificationApi.getNotifications(user.id);
      setNotifications(rows);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(() => loadNotifications());
  }, [user, loadNotifications]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `mentor_id=eq.${user.id}` },
        () => loadNotifications(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `learner_id=eq.${user.id}` },
        () => loadNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  const persist = useCallback(
    (next: Set<string>) => {
      if (!user) return;
      try {
        window.localStorage.setItem(readIdsStorageKey(user.id), JSON.stringify([...next]));
      } catch {
        // Non-fatal — read state still applies for this session.
      }
    },
    [user],
  );

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const markAllRead = useCallback(() => {
    setReadIds(() => {
      const next = new Set(notifications.map((n) => n.id));
      persist(next);
      return next;
    });
  }, [notifications, persist]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      isRead,
      markAsRead,
      markAllRead,
      refresh: loadNotifications,
    }),
    [notifications, unreadCount, loading, isRead, markAsRead, markAllRead, loadNotifications],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
