'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Song, NotificationItem } from '@/lib/types';
import { api } from '@/lib/api';
import {
  Music,
  Bell,
  Plus,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { YoutubeIcon } from '@/components/ui/icons';
import { NavTab } from '../layout/Sidebar';

interface DashboardOverviewProps {
  onNavigate: (tab: NavTab) => void;
  onAddNewSong: () => void;
  onOpenSettings: () => void;
}

export default function DashboardOverview({
  onNavigate,
  onAddNewSong,
}: DashboardOverviewProps) {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [songsRes, notifsRes] = await Promise.all([
          api.adminSongs.list(1).catch(() => ({ songs: [], meta: { current_page: 1, total_pages: 1, total_count: 0 } })),
          api.adminNotifications.list(1).catch(() => ({ notifications: [], meta: { current_page: 1, total_pages: 1, total_count: 0 } })),
        ]);

        setSongs(songsRes.songs || []);
        setNotifications(notifsRes.notifications || []);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const totalSongs = songs.length;
  const publishedSongs = songs.filter((s) => s.published).length;
  const draftSongs = totalSongs - publishedSongs;
  const totalNotifs = notifications.length;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 border border-sky-400/30 shadow-xl shadow-sky-950/10">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-lime-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-lime-300" />
              <span>Admin Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bethesda Deliverance Church
            </h1>
            <p className="text-sm text-sky-100 max-w-xl leading-relaxed">
              Welcome back, <strong className="text-white">{user?.name || 'Administrator'}</strong>.
              Manage your song lyrics repository, schedule live Sunday broadcasts, and coordinate choir ministry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onAddNewSong}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-lime-950/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Song</span>
            </button>
            <button
              onClick={() => onNavigate('notifications')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-xs sm:text-sm transition-all"
            >
              <Bell className="w-4 h-4 text-lime-300" />
              <span>Broadcast Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Songs */}
        <div
          onClick={() => onNavigate('songs')}
          className="glass-panel p-4 sm:p-5 rounded-2xl hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Music className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isLoading ? '...' : totalSongs}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Total Song Library</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {publishedSongs} published · {draftSongs} drafts
          </div>
        </div>

        {/* Published Ratio */}
        <div
          onClick={() => onNavigate('songs')}
          className="glass-panel p-4 sm:p-5 rounded-2xl hover:border-lime-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-lime-100 text-lime-700 group-hover:bg-lime-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-lime-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isLoading ? '...' : publishedSongs}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Live in Mobile App</div>
          <div className="text-[11px] text-lime-700 font-medium mt-0.5">Active & Searchable</div>
        </div>

        {/* Notifications */}
        <div
          onClick={() => onNavigate('notifications')}
          className="glass-panel p-4 sm:p-5 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {isLoading ? '...' : totalNotifs}
          </div>
          <div className="text-xs font-semibold text-slate-700 mt-1">Service Alerts</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Scheduled sermons & live feeds</div>
        </div>
      </div>

      {/* Main Grid: Recent Songs + Live Worship Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Songs */}
        <div className="lg:col-span-7 glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Songs in Library</h3>
            </div>
            <button
              onClick={() => onNavigate('songs')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {songs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No songs yet.</p>
          ) : (
            <div className="space-y-2.5">
              {songs.slice(0, 4).map((song) => (
                <div
                  key={song.id}
                  onClick={() => onNavigate('songs')}
                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-sky-50/70 border border-slate-200/80 hover:border-sky-200 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-sky-700 px-2 py-1 rounded bg-sky-100">
                      #{song.song_number}
                    </span>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 tamil-text truncate group-hover:text-sky-700 transition-colors">
                        {song.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {song.title_thanglish || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        song.published
                          ? 'bg-lime-100 text-lime-800 border border-lime-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {song.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Broadcasts & Announcements */}
        <div className="lg:col-span-5 glass-panel p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Service Broadcasts</h3>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No service alerts yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-semibold text-sky-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.notification_date}
                    </span>
                    {item.youtube_url && (
                      <a
                        href={item.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <YoutubeIcon className="w-3 h-3 text-rose-600" />
                        <span>Watch</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 tamil-text leading-snug">
                    {item.title}
                  </div>
                  {item.preacher_name && (
                    <div className="text-[11px] text-slate-500 tamil-text">
                      Preacher: {item.preacher_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
