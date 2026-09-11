'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NotificationItem, NotificationsResponse } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/icons';
import NotificationEditorModal from './NotificationEditorModal';

export default function NotificationManager() {
  const { errorToast, successToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, total_pages: 1, total_count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<NotificationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotifications = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const res = await api.adminNotifications.list(page);
        setNotifications(res.notifications || []);
        if (res.meta) setMeta(res.meta);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load notifications';
        errorToast(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [errorToast]
  );

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [fetchNotifications, currentPage]);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await api.adminNotifications.delete(deletingItem.id);
      setNotifications((prev) => prev.filter((n) => n.id !== deletingItem.id));
      setMeta((prev) => ({ ...prev, total_count: Math.max(0, prev.total_count - 1) }));
      successToast('Notification removed successfully.');
      setDeletingItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete notification';
      errorToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.preacher_name && item.preacher_name.toLowerCase().includes(q)) ||
      (item.scripture_text && item.scripture_text.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-lime-50/40 border border-sky-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-100 text-sky-700 border border-sky-200">
              Admin / Notifications
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Total: {meta.total_count || notifications.length} Alerts
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Announcement & Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Broadcast Sunday worship live links, preachers, and scripture texts directly to congregation mobile phones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchNotifications(currentPage)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notification</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by title, preacher, or scripture..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
        />
      </div>

      {/* Notifications List */}
      {isLoading && notifications.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-sky-100 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-sky-100">
          <Bell className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No Notifications</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `No notifications matching "${searchQuery}".`
              : 'Create a notification to announce services, fasting prayers, or live sermons.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-5 rounded-2xl border border-sky-100/90 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between gap-4 shadow-sm group bg-white"
            >
              <div>
                {/* Date & Tag */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    {item.notification_date}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: #{item.id}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tamil-text leading-snug">
                  {item.title}
                </h3>

                {/* Preacher & Scripture Badges */}
                <div className="mt-3 space-y-2 text-xs">
                  {item.preacher_name && (
                    <div className="flex items-center gap-2 text-slate-700 tamil-text">
                      <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-medium">{item.preacher_name}</span>
                    </div>
                  )}

                  {item.scripture_text && (
                    <div className="flex items-center gap-2 text-slate-600 tamil-text">
                      <BookOpen className="w-3.5 h-3.5 text-lime-600 shrink-0" />
                      <span className="italic">{item.scripture_text}</span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer with YouTube & Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {item.youtube_url ? (
                  <a
                    href={item.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                  >
                    <YoutubeIcon className="w-3.5 h-3.5 text-rose-600" />
                    <span>Watch Sermon</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">No stream link</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsEditorOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors"
                    title="Edit Notification"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
          <span>
            Page {meta.current_page} of {meta.total_pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-30 hover:bg-sky-50 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={currentPage >= meta.total_pages}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-30 hover:bg-sky-50 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      <NotificationEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        notification={editingItem}
        onSaved={(saved) => {
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === saved.id);
            if (exists) {
              return prev.map((n) => (n.id === saved.id ? saved : n));
            }
            return [saved, ...prev];
          });
        }}
      />

      {/* Delete Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-rose-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Notification?</h3>
            <p className="text-xs text-slate-600 tamil-text">
              Are you sure you want to delete &quot;{deletingItem.title}&quot;? This notification will be removed from all users&apos; feeds.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
