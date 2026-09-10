'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Song, PaginationMeta } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import SongEditorModal from './SongEditorModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Music,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';

interface SongManagerProps {
  initialOpenCreate?: boolean;
  onOpenCreateHandled?: () => void;
}

export default function SongManager({
  initialOpenCreate = false,
  onOpenCreateHandled,
}: SongManagerProps) {
  const { successToast, errorToast } = useToast();

  const [songs, setSongs] = useState<Song[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [previewSong, setPreviewSong] = useState<Song | null>(null);

  const fetchSongs = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const res = await api.adminSongs.list(page);
        setSongs(res.songs || []);
        if (res.meta) {
          setMeta(res.meta);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load songs';
        errorToast(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [errorToast]
  );

  useEffect(() => {
    fetchSongs(currentPage);
  }, [fetchSongs, currentPage]);

  useEffect(() => {
    if (initialOpenCreate) {
      setEditingSong(null);
      setIsEditorOpen(true);
      if (onOpenCreateHandled) onOpenCreateHandled();
    }
  }, [initialOpenCreate, onOpenCreateHandled]);

  const handleTogglePublish = async (song: Song) => {
    try {
      const updated = await api.adminSongs.update(song.id, {
        song_number: song.song_number,
        title: song.title,
        title_thanglish: song.title_thanglish,
        published: !song.published,
        song_verses_attributes: (song.song_verses || []).map((v) => ({
          id: v.id,
          verse_type: v.verse_type,
          verse_number: v.verse_number,
          position: v.position,
          content: v.content,
        })),
      });

      setSongs((prev) => prev.map((s) => (s.id === song.id ? updated : s)));
      successToast(
        `Song #${song.song_number} is now ${updated.published ? 'Published' : 'set to Draft'}.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update song status';
      errorToast(msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSong) return;
    setIsDeleting(true);
    try {
      await api.adminSongs.delete(deletingSong.id);
      setSongs((prev) => prev.filter((s) => s.id !== deletingSong.id));
      setMeta((prev) => ({ ...prev, total_count: Math.max(0, prev.total_count - 1) }));
      successToast(`Song #${deletingSong.song_number} deleted successfully.`);
      setDeletingSong(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete song';
      errorToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side query and tab filter
  const filteredSongs = songs.filter((song) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      song.title.toLowerCase().includes(q) ||
      song.title_thanglish.toLowerCase().includes(q) ||
      song.song_number.toString().includes(q);

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && song.published) ||
      (filterStatus === 'draft' && !song.published);

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-5 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/80 border border-indigo-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Admin / Songs
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total: {meta.total_count || songs.length} Songs
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Songs & Hymns Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Create and edit song lyrics in Tamil and English with nested verses and chorus ordering.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchSongs(currentPage)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingSong(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Song</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by song #, Tamil title, or English..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start md:self-auto">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && songs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading songs from admin endpoint...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800">
          <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Songs Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery
              ? `No results matching "${searchQuery}". Try a different search.`
              : 'No songs in this view. Click "Add New Song" to create one.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile/tablet) */}
          <div className="hidden lg:block glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Song Title (Tamil)</th>
                  <th className="py-3 px-4">English / Thanglish</th>
                  <th className="py-3 px-4 text-center">Verses</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                {filteredSongs.map((song) => (
                  <tr
                    key={song.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                      #{song.song_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white tamil-text">
                      {song.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {song.title_thanglish || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {song.song_verses?.length || 0} blocks
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(song)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:scale-105 ${
                          song.published
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                        title="Click to toggle status"
                      >
                        {song.published ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewSong(song)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Preview Lyrics"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSong(song);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/50 transition-colors"
                          title="Edit Song"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSong(song)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                          title="Delete Song"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                      Song #{song.song_number}
                    </span>
                    <button
                      onClick={() => handleTogglePublish(song)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        song.published
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {song.published ? 'Published' : 'Draft'}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white tamil-text leading-snug">
                    {song.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {song.title_thanglish || '—'}
                  </p>

                  <div className="mt-2 text-[11px] text-slate-500">
                    {song.song_verses?.length || 0} verse blocks
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewSong(song)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSong(song);
                        setIsEditorOpen(true);
                      }}
                      className="p-2 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSong(song)}
                      className="p-2 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-950/60 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Page {meta.current_page} of {meta.total_pages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white disabled:opacity-30 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
                  disabled={currentPage >= meta.total_pages}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white disabled:opacity-30 hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Song Editor Modal */}
      <SongEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        song={editingSong}
        onSaved={(savedSong) => {
          setSongs((prev) => {
            const exists = prev.some((s) => s.id === savedSong.id);
            if (exists) {
              return prev.map((s) => (s.id === savedSong.id ? savedSong : s));
            }
            return [savedSong, ...prev];
          });
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-rose-500/30 space-y-4">
            <h3 className="text-base font-bold text-white">Delete Song #{deletingSong.song_number}?</h3>
            <p className="text-xs text-slate-300 tamil-text">
              Are you sure you want to delete &quot;{deletingSong.title}&quot;? Per the API specification, deleting a song cascades and removes all of its verses permanently.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSong(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Preview Drawer / Modal */}
      {previewSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-lg rounded-2xl max-h-[85vh] flex flex-col border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">
                  #{previewSong.song_number}
                </span>
                <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {previewSong.title_thanglish || previewSong.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewSong(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-center pb-2">
                <h2 className="text-xl font-bold text-white tamil-text">{previewSong.title}</h2>
                <p className="text-xs text-indigo-300 mt-0.5">{previewSong.title_thanglish}</p>
              </div>

              {previewSong.song_verses && previewSong.song_verses.length > 0 ? (
                previewSong.song_verses.map((v, i) => (
                  <div
                    key={v.id || i}
                    className={`p-3.5 rounded-xl border text-center ${
                      v.verse_type === 'chorus'
                        ? 'bg-indigo-950/40 border-indigo-500/30'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-1">
                      {v.verse_type === 'verse'
                        ? `Verse ${v.verse_number || i + 1}`
                        : v.verse_type.toUpperCase()}
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed tamil-text">
                      {v.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-slate-500">No verses available for this song.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
