'use client';

import React, { useState, useEffect } from 'react';
import { Song, SongVerse, VerseType, SongInput } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Music,
  Check,
  Eye,
  Edit3,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface SongEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSaved: (savedSong: Song) => void;
}

interface EditableVerse extends SongVerse {
  tempKey: string;
}

export default function SongEditorModal({
  isOpen,
  onClose,
  song,
  onSaved,
}: SongEditorModalProps) {
  const { successToast, errorToast } = useToast();

  const [songNumber, setSongNumber] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [titleThanglish, setTitleThanglish] = useState<string>('');
  const [published, setPublished] = useState<boolean>(true);
  const [verses, setVerses] = useState<EditableVerse[]>([]);
  const [destroyedVerseIds, setDestroyedVerseIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (song) {
        setSongNumber(song.song_number);
        setTitle(song.title);
        setTitleThanglish(song.title_thanglish);
        setPublished(song.published);
        const mappedVerses: EditableVerse[] = (song.song_verses || []).map((v, idx) => ({
          ...v,
          position: v.position ?? idx,
          tempKey: `v-${v.id || idx}-${Math.random()}`,
        }));
        setVerses(mappedVerses);
        setDestroyedVerseIds([]);
      } else {
        // Default new song template
        setSongNumber(1);
        setTitle('');
        setTitleThanglish('');
        setPublished(true);
        setVerses([
          {
            verse_type: 'chorus',
            verse_number: null,
            position: 0,
            content: '',
            tempKey: `init-${Math.random()}`,
          },
          {
            verse_type: 'verse',
            verse_number: 1,
            position: 1,
            content: '',
            tempKey: `init2-${Math.random()}`,
          },
        ]);
        setDestroyedVerseIds([]);
      }
      setPreviewMode(false);
    }
  }, [isOpen, song]);

  if (!isOpen) return null;

  const handleAddVerse = (type: VerseType) => {
    // Count existing verses of type 'verse' to set next verse number
    const existingNumberedVerses = verses.filter((v) => v.verse_type === 'verse');
    const nextVerseNumber = type === 'verse' ? existingNumberedVerses.length + 1 : null;

    const newVerse: EditableVerse = {
      verse_type: type,
      verse_number: nextVerseNumber,
      position: verses.length,
      content: '',
      tempKey: `new-${Date.now()}-${Math.random()}`,
    };

    setVerses((prev) => [...prev, newVerse]);
  };

  const handleUpdateVerse = (tempKey: string, updates: Partial<EditableVerse>) => {
    setVerses((prev) =>
      prev.map((v) => {
        if (v.tempKey === tempKey) {
          const updated = { ...v, ...updates };
          // If changing away from 'verse', clear verse_number
          if (updates.verse_type && updates.verse_type !== 'verse') {
            updated.verse_number = null;
          }
          return updated;
        }
        return v;
      })
    );
  };

  const handleRemoveVerse = (tempKey: string) => {
    const verseToRemove = verses.find((v) => v.tempKey === tempKey);
    if (!verseToRemove) return;

    if (verseToRemove.id) {
      // Verse exists on server, track for _destroy: true
      setDestroyedVerseIds((prev) => [...prev, verseToRemove.id!]);
    }

    setVerses((prev) => {
      const filtered = prev.filter((v) => v.tempKey !== tempKey);
      // Re-index positions
      return filtered.map((v, idx) => ({ ...v, position: idx }));
    });
  };

  const handleMoveVerse = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === verses.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...verses];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update positions
    const updated = reordered.map((v, idx) => ({ ...v, position: idx }));
    setVerses(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() && !titleThanglish.trim()) {
      errorToast('Please enter at least a Tamil or English/Thanglish title.');
      return;
    }

    if (verses.length === 0) {
      errorToast('Please add at least one verse or chorus.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build song_verses_attributes according to API spec:
      // "omit id to add a verse, include id to update one, add _destroy: true to remove one"
      const versesAttributes: SongInput['song_verses_attributes'] = [];

      // Add active verses
      verses.forEach((v, idx) => {
        const item: SongInput['song_verses_attributes'][0] = {
          verse_type: v.verse_type,
          verse_number: v.verse_type === 'verse' ? Number(v.verse_number || 1) : null,
          position: idx,
          content: v.content,
        };
        if (v.id) {
          item.id = v.id;
        }
        versesAttributes.push(item);
      });

      // Add destroyed verses
      destroyedVerseIds.forEach((id) => {
        versesAttributes.push({
          id,
          verse_type: 'verse',
          position: 999,
          _destroy: true,
        });
      });

      const payload: SongInput = {
        song_number: Number(songNumber),
        title: title.trim(),
        title_thanglish: titleThanglish.trim(),
        published,
        song_verses_attributes: versesAttributes,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated w-full max-w-4xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[92vh] sm:max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {isEditing ? `Edit Song #${song.song_number}` : 'Add New Song'}
              </h2>
              <p className="text-xs text-slate-400">
                Manage lyrics, nested verses order, and publication status
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
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {previewMode ? (
            /* Live Mobile App Preview */
            <div className="max-w-md mx-auto bg-[#070b14] rounded-3xl p-5 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Song #{songNumber}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    published
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {published ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="text-center py-2">
                <h3 className="text-xl font-bold text-white tamil-text">
                  {title || 'பாடல் தலைப்பு'}
                </h3>
                <p className="text-sm font-medium text-indigo-300 mt-1">
                  {titleThanglish || 'Song Title in English'}
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {verses.length === 0 ? (
                  <p className="text-xs text-center text-slate-500 py-6">No verses added yet.</p>
                ) : (
                  verses.map((v, idx) => (
                    <div
                      key={v.tempKey}
                      className={`p-3.5 rounded-2xl border text-center ${
                        v.verse_type === 'chorus'
                          ? 'bg-indigo-950/40 border-indigo-500/30 shadow-sm'
                          : v.verse_type === 'intro'
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-1.5">
                        {v.verse_type === 'verse'
                          ? `Verse ${v.verse_number || idx + 1}`
                          : v.verse_type.toUpperCase()}
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed tamil-text">
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Song Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={songNumber}
                    onChange={(e) => setSongNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Tamil Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="அப்பா வீட்டில் எப்போதும்..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 tamil-text"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    English / Thanglish Title
                  </label>
                  <input
                    type="text"
                    value={titleThanglish}
                    onChange={(e) => setTitleThanglish(e.target.value)}
                    placeholder="Appa Veetil Eppothum..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Published Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white">Publication Status</span>
                  <p className="text-[11px] text-slate-400">
                    Published songs are immediately visible to congregation in the mobile app.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Nested Verses Manager */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Verses & Chorus Structure ({verses.length})
                    </h3>
                  </div>

                  {/* Add verse quick buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 mr-1">Add:</span>
                    <button
                      type="button"
                      onClick={() => handleAddVerse('chorus')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors"
                    >
                      + Chorus
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVerse('verse')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      + Verse
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVerse('intro')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                    >
                      + Intro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddVerse('bridge')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      + Bridge
                    </button>
                  </div>
                </div>

                {verses.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
                    <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">No verses added yet.</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Click &quot;+ Chorus&quot; or &quot;+ Verse&quot; above to add lyrics.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verses.map((verse, index) => (
                      <div
                        key={verse.tempKey}
                        className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 shadow-sm space-y-3 hover:border-slate-700/80 transition-all"
                      >
                        {/* Verse Card Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            <select
                              value={verse.verse_type}
                              onChange={(e) =>
                                handleUpdateVerse(verse.tempKey, {
                                  verse_type: e.target.value as VerseType,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                            >
                              <option value="chorus">Chorus</option>
                              <option value="verse">Verse</option>
                              <option value="intro">Intro</option>
                              <option value="bridge">Bridge</option>
                              <option value="outro">Outro</option>
                            </select>

                            {verse.verse_type === 'verse' && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-400">#</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={verse.verse_number ?? index + 1}
                                  onChange={(e) =>
                                    handleUpdateVerse(verse.tempKey, {
                                      verse_number: parseInt(e.target.value, 10) || 1,
                                    })
                                  }
                                  className="w-12 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white text-xs font-semibold text-center"
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
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveVerse(index, 'down')}
                              disabled={index === verses.length - 1}
                              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveVerse(verse.tempKey)}
                              className="p-1 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 ml-1"
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
                            className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-xs sm:text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-normal tamil-text"
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
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl">
          <span className="text-xs text-slate-400">
            {isEditing ? `Song ID: ${song.id}` : 'Drafting new hymn'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="song-editor-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
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
