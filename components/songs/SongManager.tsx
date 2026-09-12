'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Song, SongsResponse } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Music,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import SongEditorModal from './SongEditorModal';

interface SongManagerProps {
  initialOpenCreate?: boolean;
  onOpenCreateHandled?: () => void;
}

export default function SongManager({
  initialOpenCreate = false,
  onOpenCreateHandled,
}: SongManagerProps) {
  const { errorToast, successToast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, total_pages: 1, total_count: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [deletingSong, setDeletingSong] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-lime-50/40 border border-sky-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-100 text-sky-700 border border-sky-200">
              Admin / Songs
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Total: {meta.total_count || songs.length} Songs
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Songs and Lyric Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create and edit song lyrics in Tamil and English with nested verses and chorus ordering.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchSongs(currentPage)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingSong(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all active:scale-95"
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && songs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-sky-100 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading songs from admin endpoint...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-sky-100">
          <Music className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900">No Songs Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `No results matching "${searchQuery}". Try a different search.`
              : 'No songs in this view. Click "Add New Song" to create one.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block glass-panel rounded-2xl border border-sky-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Song Title (Tamil)</th>
                  <th className="py-3 px-4">English / Thanglish</th>
                  <th className="py-3 px-4 text-center">Stanza</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredSongs.map((song) => (
                  <tr
                    key={song.id}
                    className="hover:bg-sky-50/50 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                      #{song.song_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 tamil-text">
                      {song.title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {song.title_thanglish || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                        {song.song_verses?.length || 0} blocks
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewSong(song)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Preview Lyrics"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSong(song);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-sky-600 hover:text-sky-800 hover:bg-sky-50 transition-colors"
                          title="Edit Song"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSong(song)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
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
                className="glass-panel p-4 rounded-2xl border border-sky-100 flex flex-col justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-sky-700 px-2 py-0.5 rounded-md bg-sky-100 border border-sky-200">
                      Song #{song.song_number}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 tamil-text leading-snug">
                    {song.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {song.title_thanglish || '—'}
                  </p>

                  <div className="mt-2 text-[11px] text-slate-400">
                    {song.song_verses?.length || 0} verse blocks
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setPreviewSong(song)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-sky-600"
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
                      className="p-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingSong(song)}
                      className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-rose-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Song #{deletingSong.song_number}?</h3>
            <p className="text-xs text-slate-600 tamil-text">
              Are you sure you want to delete &quot;{deletingSong.title}&quot;? Per the API specification, deleting a song cascades and removes all of its verses permanently.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSong(null)}
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
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lyrics Preview Modal */}
      {previewSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-lg rounded-2xl max-h-[85vh] flex flex-col border border-sky-100 shadow-2xl bg-white">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700">
                  #{previewSong.song_number}
                </span>
                <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[280px]">
                  {previewSong.title_thanglish || previewSong.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewSong(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-center pb-2">
                <h2 className="text-xl font-bold text-slate-900 tamil-text">{previewSong.title}</h2>
                <p className="text-xs text-sky-700 font-medium mt-0.5">{previewSong.title_thanglish}</p>
              </div>

              {previewSong.song_verses && previewSong.song_verses.length > 0 ? (
                previewSong.song_verses.map((v, i) => (
                  <div
                    key={v.id || i}
                    className={`p-3.5 rounded-xl border text-center ${
                      v.verse_type === 'chorus'
                        ? 'bg-sky-50/80 border-sky-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1">
                      {v.verse_type === 'stanza'
                        ? `Verse ${v.verse_number || i + 1}`
                        : v.verse_type.toUpperCase()}
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed tamil-text font-medium">
                      {v.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-slate-400">No verses available for this song.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
