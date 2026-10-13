'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PrayerRequest, PaginationMeta } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  HandHeart,
  Search,
  RefreshCw,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Volume2,
  Play,
  Pause,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Info,
  AlertCircle,
  X,
} from 'lucide-react';

export default function PrayerRequestManager() {
  const { successToast, errorToast } = useToast();

  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'prayed_for'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deviceIdFilter, setDeviceIdFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingId, setIsUpdatingId] = useState<number | null>(null);

  // Audio playback state
  const [activeAudioUrl, setActiveAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modals state
  const [detailItem, setDetailItem] = useState<PrayerRequest | null>(null);
  const [deletingItem, setDeletingItem] = useState<PrayerRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchPrayerRequests = useCallback(
    async (page = 1, status = statusFilter, deviceId = deviceIdFilter) => {
      setIsLoading(true);
      try {
        const res = await api.adminPrayerRequests.list({
          page,
          status: status === 'all' ? undefined : status,
          device_id: deviceId.trim() || undefined,
        });

        const list = res.prayer_requests || [];
        setRequests(list);
        if (res.meta) {
          setMeta(res.meta);
          setCurrentPage(res.meta.current_page || page);
        } else {
          setMeta({
            current_page: page,
            total_pages: 1,
            total_count: list.length,
          });
        }
      } catch (err: unknown) {
        console.error('Error fetching prayer requests:', err);
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Failed to load prayer requests';
        errorToast(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, deviceIdFilter, errorToast]
  );

  useEffect(() => {
    fetchPrayerRequests(currentPage, statusFilter, deviceIdFilter);
  }, [fetchPrayerRequests, currentPage, statusFilter, deviceIdFilter]);

  const handleStatusChange = async (req: PrayerRequest, newStatus: string) => {
    setIsUpdatingId(req.id);
    try {
      const updated = await api.adminPrayerRequests.updateStatus(req.id, newStatus);
      setRequests((prev) =>
        prev.map((item) => (item.id === req.id ? { ...item, status: updated.status || newStatus } : item))
      );
      if (detailItem && detailItem.id === req.id) {
        setDetailItem((prev) => (prev ? { ...prev, status: updated.status || newStatus } : null));
      }
      successToast(
        newStatus === 'prayed_for'
          ? 'Marked prayer request as "Prayed For"!'
          : 'Reverted status to "Pending".'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update prayer request status';
      errorToast(msg);
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await api.adminPrayerRequests.delete(deletingItem.id);
      setRequests((prev) => prev.filter((r) => r.id !== deletingItem.id));
      setMeta((prev) => ({
        ...prev,
        total_count: Math.max(0, prev.total_count - 1),
      }));
      if (detailItem?.id === deletingItem.id) {
        setDetailItem(null);
      }
      successToast('Prayer request deleted successfully.');
      setDeletingItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete prayer request';
      errorToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAudio = (url: string) => {
    if (!audioRef.current) return;

    if (activeAudioUrl === url && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setActiveAudioUrl(url);
      audioRef.current.src = url;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Audio playback failed:', err);
          errorToast('Unable to play audio recording.');
          setIsPlaying(false);
        });
    }
  };

  // Local search filter
  const filteredRequests = requests.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.mobile && item.mobile.includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.device_id && item.device_id.toLowerCase().includes(q)) ||
      (item.user?.name && item.user.name.toLowerCase().includes(q)) ||
      (item.user?.email && item.user.email.toLowerCase().includes(q))
    );
  });

  // Counters
  const pendingCount = requests.filter((r) => r.status !== 'prayed_for').length;
  const prayedForCount = requests.filter((r) => r.status === 'prayed_for').length;
  const voiceNotesCount = requests.filter((r) => !!r.voice_note_url).length;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Hidden Audio element for voice playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 text-white shadow-xl shadow-sky-950/10 border border-sky-400/20">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-lime-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
              <HandHeart className="w-3.5 h-3.5 text-lime-300" />
              <span>Intercession & Ministry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Prayer Requests
            </h1>
            <p className="text-sm text-sky-100 max-w-xl">
              Listen to voice notes, review urgent requests submitted by church members, and mark
              requests as prayed for.
            </p>
          </div>

          <button
            onClick={() => fetchPrayerRequests(currentPage, statusFilter, deviceIdFilter)}
            disabled={isLoading}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/30 text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-lime-300 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-sky-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Requests</span>
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <HandHeart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {meta.total_count || requests.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded submissions</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Pending Intercession</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting prayer</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Prayed For</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {prayedForCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Completed</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-indigo-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Voice Notes</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2">
            {voiceNotesCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Audio recordings</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-sky-100 bg-white/80 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 self-start">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => {
                setStatusFilter('pending');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending</span>
            </button>
            <button
              onClick={() => {
                setStatusFilter('prayed_for');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusFilter === 'prayed_for'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Prayed For</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, need, or device ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Device ID Filter Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by device ID..."
              value={deviceIdFilter}
              onChange={(e) => {
                setDeviceIdFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40 sm:w-48 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800 placeholder:text-slate-400"
            />
            {deviceIdFilter && (
              <button
                onClick={() => setDeviceIdFilter('')}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content List */}
      {isLoading ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Loading prayer requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3 bg-white/70 border border-dashed border-slate-300">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <HandHeart className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Prayer Requests Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No requests match your current search or filter criteria. Try clearing filters.'
              : 'Prayer requests submitted through the member app will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredRequests.map((req) => {
            const isPrayed = req.status === 'prayed_for';
            const isThisAudioPlaying = activeAudioUrl === req.voice_note_url && isPlaying;
            const displayName = req.name || req.user?.name || 'Anonymous';
            const displayPhone = req.mobile || req.user?.phone || null;

            return (
              <div
                key={req.id}
                className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all duration-200 group ${
                  isPrayed
                    ? 'border-emerald-200/80 bg-white/90 hover:border-emerald-300'
                    : 'border-amber-200/80 bg-white/95 hover:border-amber-300 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Requester & Description */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Header info row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Requester Avatar & Name */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm ${
                            isPrayed
                              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-tr from-sky-500 to-blue-600'
                          }`}
                        >
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 leading-tight">
                            {displayName}
                          </div>
                          {req.user && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-sky-700 font-medium">
                              <ShieldCheck className="w-3 h-3 text-sky-500" />
                              Registered Member
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isPrayed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isPrayed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Prayed For</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending</span>
                          </>
                        )}
                      </span>

                      {/* Contact Phone */}
                      {displayPhone && (
                        <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a
                            href={`tel:${displayPhone}`}
                            className="font-mono text-slate-800 hover:text-sky-600 font-semibold"
                          >
                            {displayPhone}
                          </a>
                          <button
                            onClick={() => handleCopy(displayPhone, `phone-${req.id}`)}
                            title="Copy Phone"
                            className="p-0.5 text-slate-400 hover:text-slate-600 ml-0.5"
                          >
                            {copiedId === `phone-${req.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Date & Time */}
                      {req.created_at && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono ml-auto lg:ml-0">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(req.created_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Prayer Description */}
                    <div className="text-slate-800 text-sm leading-relaxed font-normal bg-slate-50/60 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {req.description || <span className="italic text-slate-400">No text description provided.</span>}
                    </div>

                    {/* Device & User Footer Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {req.device_id && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/90 text-[10px] text-slate-600 font-mono">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          <span>Device: {req.device_id.slice(0, 12)}...</span>
                          <button
                            onClick={() => handleCopy(req.device_id!, `dev-${req.id}`)}
                            className="p-0.5 text-slate-400 hover:text-slate-700"
                            title="Copy full device ID"
                          >
                            {copiedId === `dev-${req.id}` ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {req.user?.email && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-[10px] text-sky-700">
                          <User className="w-3 h-3 text-sky-500" />
                          <span>{req.user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Audio & Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Voice Note Player Pill */}
                    {req.voice_note_url ? (
                      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
                        <button
                          onClick={() => toggleAudio(req.voice_note_url!)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            isThisAudioPlaying
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {isThisAudioPlaying ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Play Audio</span>
                            </>
                          )}
                        </button>
                        <a
                          href={req.voice_note_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-indigo-100 transition-colors"
                          title="Open audio in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Mark Status Button */}
                      <button
                        onClick={() =>
                          handleStatusChange(req, isPrayed ? 'pending' : 'prayed_for')
                        }
                        disabled={isUpdatingId === req.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          isPrayed
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        }`}
                      >
                        {isUpdatingId === req.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isPrayed ? (
                          <>
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>Reopen</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Prayed</span>
                          </>
                        )}
                      </button>

                      {/* Detail Modal Button */}
                      <button
                        onClick={() => setDetailItem(req)}
                        className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 border border-slate-200/70 transition-colors"
                        title="View details"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeletingItem(req)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 transition-colors"
                        title="Delete prayer request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between glass-panel p-3 sm:p-4 rounded-2xl border border-sky-100">
          <span className="text-xs text-slate-500 font-mono">
            Page {meta.current_page} of {meta.total_pages} (Total {meta.total_count} requests)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1 || isLoading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 px-2">{meta.current_page}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
              disabled={meta.current_page >= meta.total_pages || isLoading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden space-y-5 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <HandHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Prayer Request Details</h3>
                  <span className="text-xs text-slate-400">ID #{detailItem.id}</span>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[11px] block">Requester Name</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {detailItem.name || detailItem.user?.name || 'Anonymous'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Status</span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full ${
                      detailItem.status === 'prayed_for'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {detailItem.status === 'prayed_for' ? 'Prayed For' : 'Pending'}
                  </span>
                </div>
                {detailItem.mobile && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Contact Number</span>
                    <a
                      href={`tel:${detailItem.mobile}`}
                      className="font-mono font-bold text-sky-700 hover:underline"
                    >
                      {detailItem.mobile}
                    </a>
                  </div>
                )}
                {detailItem.created_at && (
                  <div>
                    <span className="text-slate-400 text-[11px] block">Submitted Date</span>
                    <span className="font-mono text-slate-700 text-xs">
                      {new Date(detailItem.created_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <span className="text-slate-500 font-bold block mb-1">Prayer Need:</span>
                <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">
                  {detailItem.description || 'No description provided.'}
                </div>
              </div>

              {/* Voice Note */}
              {detailItem.voice_note_url && (
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-medium">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>Voice Note Audio Attached</span>
                  </div>
                  <button
                    onClick={() => toggleAudio(detailItem.voice_note_url!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    {activeAudioUrl === detailItem.voice_note_url && isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Technical identifiers */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                {detailItem.device_id && (
                  <div className="flex items-center justify-between">
                    <span>Device ID:</span>
                    <span className="text-slate-700 truncate max-w-[280px]">
                      {detailItem.device_id}
                    </span>
                  </div>
                )}
                {detailItem.user && (
                  <div className="flex items-center justify-between">
                    <span>User Account:</span>
                    <span className="text-slate-700">
                      {detailItem.user.name} ({detailItem.user.email})
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const target = detailItem;
                  setDetailItem(null);
                  setDeletingItem(target);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <button
                onClick={() =>
                  handleStatusChange(
                    detailItem,
                    detailItem.status === 'prayed_for' ? 'pending' : 'prayed_for'
                  )
                }
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                {detailItem.status === 'prayed_for' ? 'Mark as Pending' : 'Mark as Prayed For'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Prayer Request?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently remove this request from{' '}
                <strong className="text-slate-800">
                  {deletingItem.name || deletingItem.user?.name || 'Anonymous'}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingItem(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md shadow-rose-600/20 transition-all"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
