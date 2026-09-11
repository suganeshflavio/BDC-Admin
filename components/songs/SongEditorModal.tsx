'use client';

import React, { useState, useEffect } from 'react';
import { Song, SongInput, SongVerse, VerseType } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Music,
  Check,
  Layers,
  Eye,
  Edit3,
  AlertCircle,
} from 'lucide-react';

interface SongEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSaved: (savedSong: Song) => void;
}

interface VerseState {
  tempKey: string;
  id?: number;
  verse_type: VerseType;
  verse_number?: number | null;
  position: number;
  content: string;
}

export default function SongEditorModal({
  isOpen,
  onClose,
  song,
  onSaved,
}: SongEditorModalProps) {
  const { successToast, errorToast } = useToast();

  const [songNumber, setSongNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [titleThanglish, setTitleThanglish] = useState('');
  const [published, setPublished] = useState(true);
  const [verses, setVerses] = useState<VerseState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (song) {
        setSongNumber(song.song_number);
        setTitle(song.title);
        setTitleThanglish(song.title_thanglish || '');
        setPublished(song.published);
        const mappedVerses: VerseState[] = (song.song_verses || []).map((v, idx) => ({
          tempKey: `verse_${v.id || idx}_${Date.now()}`,
          id: v.id,
          verse_type: v.verse_type,
          verse_number: v.verse_number,
          position: v.position ?? idx,
          content: v.content,
        }));
        setVerses(mappedVerses);
      } else {
        setSongNumber(Date.now() % 1000);
        setTitle('');
        setTitleThanglish('');
        setPublished(true);
        setVerses([
          {
            tempKey: `verse_init_0_${Date.now()}`,
            verse_type: 'verse',
            verse_number: 1,
            position: 0,
            content: '',
          },
          {
            tempKey: `verse_init_1_${Date.now() + 1}`,
            verse_type: 'chorus',
            verse_number: null,
            position: 1,
            content: '',
          },
        ]);
      }
      setPreviewMode(false);
    }
  }, [isOpen, song]);

  if (!isOpen) return null;

  const handleAddVerse = (type: VerseType = 'verse') => {
    let nextNum: number | null = null;
    if (type === 'verse') {
      const verseCounts = verses.filter((v) => v.verse_type === 'verse').length;
      nextNum = verseCounts + 1;
    }
    const newVerse: VerseState = {
      tempKey: `verse_${Date.now()}_${Math.random()}`,
      verse_type: type,
      verse_number: nextNum,
      position: verses.length,
      content: '',
    };
    setVerses([...verses, newVerse]);
  };

  const handleRemoveVerse = (tempKey: string) => {
    setVerses(verses.filter((v) => v.tempKey !== tempKey));
  };

  const handleUpdateVerse = (tempKey: string, updates: Partial<VerseState>) => {
    setVerses(
      verses.map((v) => (v.tempKey === tempKey ? { ...v, ...updates } : v))
    );
  };

  const handleMoveVerse = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === verses.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...verses];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    const adjusted = reordered.map((item, idx) => ({
      ...item,
      position: idx,
    }));
    setVerses(adjusted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      errorToast('Tamil Song Title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: SongInput = {
        song_number: Number(songNumber),
        title: title.trim(),
        title_thanglish: titleThanglish.trim(),
        published,
        song_verses_attributes: verses.map((v, idx) => ({
          ...(v.id ? { id: v.id } : {}),
          verse_type: v.verse_type,
          verse_number: v.verse_type === 'verse' ? v.verse_number ?? idx + 1 : null,
          position: idx,
          content: v.content.trim(),
        })),
      };

      let result: Song;
      if (song) {
        result = await api.adminSongs.update(song.id, payload);
        successToast(`Song #${result.song_number} updated successfully!`);
      } else {
        result = await api.adminSongs.create(payload);
        successToast(`Song #${result.song_number} created successfully!`);
      }

      onSaved(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save song';
      errorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!song;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated w-full max-w-4xl rounded-2xl shadow-2xl border border-sky-100 flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? `Edit Song #${song.song_number}` : 'Add New Song'}
              </h2>
              <p className="text-xs text-slate-500">
                Manage lyrics, nested verses order, and song metadata
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile/Desktop Preview Toggle */}
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                previewMode
                  ? 'bg-lime-100 text-lime-800 border-lime-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
              }`}
            >
              {previewMode ? (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>App Preview</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {previewMode ? (
            /* Live Mobile App Preview */
            <div className="max-w-md mx-auto bg-gradient-to-b from-sky-50/70 via-white to-sky-50/50 rounded-3xl p-5 border border-sky-200 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-100">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                  Song #{songNumber}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-lime-100 text-lime-800 border border-lime-200">
                  Published
                </span>
              </div>

              <div className="text-center py-2">
                <h3 className="text-xl font-bold text-slate-900 tamil-text">
                  {title || 'பாடல் தலைப்பு'}
                </h3>
                <p className="text-sm font-medium text-sky-700 mt-1">
                  {titleThanglish || 'Song Title in English'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {verses.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-6">No verses added yet.</p>
                ) : (
                  verses.map((v, idx) => (
                    <div
                      key={v.tempKey}
                      className={`p-3.5 rounded-2xl border text-center ${
                        v.verse_type === 'chorus'
                          ? 'bg-sky-50 border-sky-200 shadow-sm'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider text-sky-700 mb-1.5">
                        {v.verse_type === 'verse'
                          ? `Verse ${v.verse_number || idx + 1}`
                          : v.verse_type.toUpperCase()}
                      </div>
                      <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed tamil-text font-medium">
                        {v.content || '(Lyrics content here...)'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Main Form */
            <form id="song-editor-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Primary Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Song Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={songNumber}
                    onChange={(e) => setSongNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-semibold shadow-sm"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tamil Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="அப்பா வீட்டில் எப்போதும்..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 tamil-text shadow-sm"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    English / Thanglish Title
                  </label>
                  <input
                    type="text"
                    value={titleThanglish}
                    onChange={(e) => setTitleThanglish(e.target.value)}
                    placeholder="Appa Veetil Eppothum..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm"
                  />
                </div>
              </div>

              {/* Nested Verses Manager */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Verses & Chorus Structure ({verses.length})
                    </h3>
                  </div>

                  {/* Add verse quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 mr-1">Add:</span>
                    <button
                      type="button"
                      onClick={() => handleAddVerse('chorus')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
                    >
                      + Chorus
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVerse('verse')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-lime-50 hover:bg-lime-100 text-lime-800 border border-lime-200 transition-colors"
                    >
                      + Verse
                    </button>
                  </div>
                </div>

                {verses.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-medium">No verses added yet.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click &quot;+ Chorus&quot; or &quot;+ Verse&quot; above to add lyrics.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verses.map((verse, index) => (
                      <div
                        key={verse.tempKey}
                        className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-sky-300 shadow-sm space-y-3 transition-all"
                      >
                        {/* Verse Card Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 font-mono text-xs flex items-center justify-center font-bold shadow-xs">
                              {index + 1}
                            </span>
                            <select
                              value={verse.verse_type}
                              onChange={(e) =>
                                handleUpdateVerse(verse.tempKey, {
                                  verse_type: e.target.value as VerseType,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
                            >
                              <option value="chorus">Chorus</option>
                              <option value="verse">Verse</option>
                              <option value="intro">Intro</option>
                              <option value="bridge">Bridge</option>
                              <option value="outro">Outro</option>
                            </select>

                            {verse.verse_type === 'verse' && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500">#</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={verse.verse_number ?? index + 1}
                                  onChange={(e) =>
                                    handleUpdateVerse(verse.tempKey, {
                                      verse_number: parseInt(e.target.value, 10) || 1,
                                    })
                                  }
                                  className="w-12 px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 text-xs font-semibold text-center shadow-xs"
                                />
                              </div>
                            )}
                          </div>

                          {/* Reorder and Delete Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveVerse(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveVerse(index, 'down')}
                              disabled={index === verses.length - 1}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVerse(verse.tempKey)}
                              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-1"
                              title="Delete Verse"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Lyrics Content Textarea */}
                        <div>
                          <textarea
                            rows={3}
                            value={verse.content}
                            onChange={(e) =>
                              handleUpdateVerse(verse.tempKey, { content: e.target.value })
                            }
                            placeholder="Enter lyrics lines here (Tamil or English)..."
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 leading-relaxed font-normal tamil-text shadow-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
          <span className="text-xs text-slate-500">
            {isEditing ? `Song ID: ${song.id}` : 'Drafting new hymn'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="song-editor-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Save Changes' : 'Create Song'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
