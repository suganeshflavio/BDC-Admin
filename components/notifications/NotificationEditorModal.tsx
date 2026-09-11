'use client';

import React, { useState, useEffect } from 'react';
import { NotificationItem, NotificationInput } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  X,
  Bell,
  Check,
  Calendar,
  User,
  BookOpen,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/icons';

interface NotificationEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationItem | null;
  onSaved: (savedItem: NotificationItem) => void;
}

export default function NotificationEditorModal({
  isOpen,
  onClose,
  notification,
  onSaved,
}: NotificationEditorModalProps) {
  const { successToast, errorToast } = useToast();

  const [title, setTitle] = useState('');
  const [preacherName, setPreacherName] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [notificationDate, setNotificationDate] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (notification) {
        setTitle(notification.title || '');
        setPreacherName(notification.preacher_name || '');
        setScriptureText(notification.scripture_text || '');
        setNotificationDate(notification.notification_date || '');
        setDescription(notification.description || '');
        setYoutubeUrl(notification.youtube_url || '');
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setTitle('');
        setPreacherName('');
        setScriptureText('');
        setNotificationDate(todayStr);
        setDescription('');
        setYoutubeUrl('');
      }
      setYoutubeError(null);
    }
  }, [isOpen, notification]);

  if (!isOpen) return null;

  // Validate YouTube URL according to API spec:
  // "youtube_url must be a youtube.com or youtu.be link if present"
  const validateYoutube = (url: string): boolean => {
    if (!url.trim()) return true;
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i;
    return pattern.test(url.trim());
  };

  const handleYoutubeChange = (val: string) => {
    setYoutubeUrl(val);
    if (val.trim() && !validateYoutube(val)) {
      setYoutubeError('Must be a valid youtube.com or youtu.be link');
    } else {
      setYoutubeError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      errorToast('Please enter a notification title.');
      return;
    }

    if (youtubeUrl.trim() && !validateYoutube(youtubeUrl)) {
      errorToast('Invalid YouTube URL: Must be a youtube.com or youtu.be link.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: NotificationInput = {
        title: title.trim(),
        preacher_name: preacherName.trim(),
        scripture_text: scriptureText.trim(),
        notification_date: notificationDate || new Date().toISOString().split('T')[0],
        description: description.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
      };

      let result: NotificationItem;
      if (notification) {
        result = await api.adminNotifications.update(notification.id, payload);
        successToast('Notification updated successfully.');
      } else {
        result = await api.adminNotifications.create(payload);
        successToast('Notification created and announced!');
      }

      onSaved(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save notification';
      errorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!notification;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-sky-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Notification' : 'Create Worship Notification'}
              </h2>
              <p className="text-xs text-slate-500">
                Worship service alert sent to congregation mobile app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="notification-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Service / Announcement Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ஞாயிறு ஆராதனை (Sunday Worship Service)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 tamil-text placeholder:text-slate-400"
            />
          </div>

          {/* Preacher & Scripture */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Preacher / Speaker Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={preacherName}
                  onChange={(e) => setPreacherName(e.target.value)}
                  placeholder="Rev. எட்வின் சத்தியநாதன்"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 tamil-text placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Scripture Reference
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={scriptureText}
                  onChange={(e) => setScriptureText(e.target.value)}
                  placeholder="தேற்றரவின் ஆர்ப்பரிப்பு"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 tamil-text placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Service Date *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={notificationDate}
                onChange={(e) => setNotificationDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono"
              />
            </div>
          </div>

          {/* YouTube Video URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <YoutubeIcon className="w-4 h-4 text-rose-500" />
                YouTube Live / Sermon Link
              </label>
              <span className="text-[11px] text-slate-500">youtube.com or youtu.be</span>
            </div>
            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => handleYoutubeChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none font-mono placeholder:text-slate-400 ${
                  youtubeError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                    : 'border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'
                }`}
              />
              {youtubeUrl && validateYoutube(youtubeUrl) && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition-colors"
                  title="Test Link in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {youtubeError && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{youtubeError}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Details / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter instructions, sermon notes, or worship timing..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 leading-relaxed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="notification-form"
            disabled={isSubmitting || !!youtubeError}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Save Changes' : 'Broadcast Notification'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
