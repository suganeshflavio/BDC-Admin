'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Song, NotificationItem } from '@/lib/types';
import { api, getApiBaseUrl, isDemoModeEnabled } from '@/lib/api';
import {
  Music,
  Bell,
  Plus,
  ArrowRight,
  Sparkles,
  Server,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Shield,
  Users,
  UserPlus,
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
  onOpenSettings,
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

  const isDemo = typeof window !== 'undefined' && isDemoModeEnabled();
  const currentBaseUrl = typeof window !== 'undefined' ? getApiBaseUrl() : 'http://192.168.1.64:3099/api/v1';

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/30 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bethesda Deliverance Church
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Welcome back, <strong className="text-white">{user?.name || 'Administrator'}</strong>.
              Manage your song lyrics repository, schedule live Sunday broadcasts, and coordinate choir ministry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onAddNewSong}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Song</span>
            </button>
            <button
              onClick={() => onNavigate('notifications')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Broadcast Alert</span>
            </button>
            <button
              onClick={() => onNavigate('users')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs sm:text-sm transition-all"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Register User</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Songs */}
        <div
          onClick={() => onNavigate('songs')}
          className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Music className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {isLoading ? '...' : totalSongs}
          </div>
          <div className="text-xs font-semibold text-slate-300 mt-1">Total Song Library</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {publishedSongs} published · {draftSongs} drafts
          </div>
        </div>

        {/* Published Ratio */}
        <div
          onClick={() => onNavigate('songs')}
          className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {isLoading ? '...' : publishedSongs}
          </div>
          <div className="text-xs font-semibold text-slate-300 mt-1">Live in Mobile App</div>
          <div className="text-[11px] text-emerald-400/90 mt-0.5">Active & Searchable</div>
        </div>

        {/* Notifications */}
        <div
          onClick={() => onNavigate('notifications')}
          className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {isLoading ? '...' : totalNotifs}
          </div>
          <div className="text-xs font-semibold text-slate-300 mt-1">Service Alerts</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Scheduled sermons & live feeds</div>
        </div>

        {/* Users Management */}
        <div
          onClick={() => onNavigate('users')}
          className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white">
            Users
          </div>
          <div className="text-xs font-semibold text-slate-300 mt-1">User Management</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Register & manage accounts</div>
        </div>

        {/* Server & Demo Mode Status */}
        {/* <div
          onClick={onOpenSettings}
          className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group shadow-lg col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-purple-400 group-hover:underline">Configure</span>
          </div>
          <div className="text-sm font-bold text-white truncate font-mono">
            {isDemo ? 'Demo Mode' : 'Live Endpoint'}
          </div>
          <div className="text-xs text-slate-300 mt-1">API Connection</div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
            {currentBaseUrl.replace(/^https?:\/\//, '')}
          </div>
        </div> */}
      </div>

      {/* Main Grid: Recent Songs + Live Worship Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Songs */}
        <div className="lg:col-span-7 glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Recent Songs in Library</h3>
            </div>
            <button
              onClick={() => onNavigate('songs')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {songs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No songs yet.</p>
          ) : (
            <div className="space-y-2.5">
              {songs.slice(0, 4).map((song) => (
                <div
                  key={song.id}
                  onClick={() => onNavigate('songs')}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-1 rounded bg-indigo-500/10">
                      #{song.song_number}
                    </span>
                    <div className="truncate">
                      <div className="text-xs sm:text-sm font-semibold text-white tamil-text truncate group-hover:text-indigo-300 transition-colors">
                        {song.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {song.title_thanglish || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${song.published
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
        <div className="lg:col-span-5 glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Service Broadcasts</h3>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No service alerts yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.notification_date}
                    </span>
                    {item.youtube_url && (
                      <a
                        href={item.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold flex items-center gap-1"
                      >
                        <YoutubeIcon className="w-3 h-3 text-rose-400" />
                        <span>Watch</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white tamil-text leading-snug">
                    {item.title}
                  </div>
                  {item.preacher_name && (
                    <div className="text-[11px] text-slate-400 tamil-text">
                      Preacher: {item.preacher_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin API Reference Quick Status Bar */}
      {/* <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Operating in <strong className="text-slate-200">Admin-Only Mode</strong> per API Reference documentation.
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <span>/admin/songs (CRUD)</span>
          <span>•</span>
          <span>/admin/notifications (CRUD)</span>
          <span>•</span>
          <span>/admin/about_us (PUT)</span>
        </div>
      </div> */}
    </div>
  );
}
