'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Announcement, PaginationMeta } from '@/lib/types';
import { api, parseBannerImage } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  Image as ImageIcon,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Layers,
} from 'lucide-react';
import BannerEditorModal from './BannerEditorModal';

interface BannerManagerProps {
  initialOpenCreate?: boolean;
  onOpenCreateHandled?: () => void;
}

export default function BannerManager({
  initialOpenCreate = false,
  onOpenCreateHandled,
}: BannerManagerProps) {
  const { errorToast, successToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Active image index per announcement for carousel previewing
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<number, number>>({});

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [deletingItem, setDeletingItem] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Full-size image preview lightbox modal
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);

  const fetchAnnouncements = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await api.adminAnnouncements.list(page);
        setAnnouncements(res.announcements || []);
        if (res.meta) {
          setMeta(res.meta);
        } else {
          setMeta({
            current_page: page,
            total_pages: 1,
            total_count: res.announcements?.length || 0,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load banner announcements';
        setFetchError(msg);
        errorToast(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [errorToast]
  );

  useEffect(() => {
    fetchAnnouncements(currentPage);
  }, [fetchAnnouncements, currentPage]);

  useEffect(() => {
    if (initialOpenCreate) {
      setEditingItem(null);
      setIsEditorOpen(true);
      onOpenCreateHandled?.();
    }
  }, [initialOpenCreate, onOpenCreateHandled]);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await api.adminAnnouncements.delete(deletingItem.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingItem.id));
      setMeta((prev) => ({
        ...prev,
        total_count: Math.max(0, prev.total_count - 1),
      }));
      successToast('Banner image announcement deleted.');
      setDeletingItem(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete announcement';
      errorToast(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNextImage = (announcementId: number, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[announcementId] || 0;
      return { ...prev, [announcementId]: (current + 1) % totalImages };
    });
  };

  const handlePrevImage = (announcementId: number, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => {
      const current = prev[announcementId] || 0;
      return { ...prev, [announcementId]: (current - 1 + totalImages) % totalImages };
    });
  };

  const filteredAnnouncements = announcements.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const subjectMatch = item.subject?.toLowerCase().includes(q) || false;
    const descMatch = item.description?.toLowerCase().includes(q) || false;
    const imgMatch = (item.banner_images || []).some((img) => img.toLowerCase().includes(q));
    return subjectMatch || descMatch || imgMatch;
  });

  return (
    <div className="space-y-5 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-lime-50/40 border border-sky-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-100 text-sky-700 border border-sky-200">
              Admin / Banner Image
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Total: {meta.total_count || announcements.length} Banners
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Banner Images & Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Manage carousel banners, special service announcements, and event highlights displayed at the top of the mobile app.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchAnnouncements(currentPage)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-sky-600 hover:bg-sky-50 transition-colors shadow-sm"
            title="Refresh banner list"
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
            <span>Add Banner Image</span>
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
          placeholder="Filter by subject, description, or image link..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
        />
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="text-xs">
            <span className="font-semibold">Unable to fetch announcements: </span>
            <span>{fetchError}</span>
          </div>
          <button
            onClick={() => fetchAnnouncements(currentPage)}
            className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors self-start sm:self-auto"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Content Area */}
      {isLoading && announcements.length === 0 ? (
        <div className="p-16 text-center rounded-2xl glass-panel border border-sky-100 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading banner announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-16 text-center rounded-2xl glass-panel border border-sky-100 bg-white/60">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-3 text-sky-600">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Banner Images Found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No banner announcements matching "${searchQuery}".`
              : 'Add your first promotional banner or event announcement to display on the mobile app home screen.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIsEditorOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Banner Image</span>
            </button>
          )}
        </div>
      ) : (
        /* Announcements Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnnouncements.map((item) => {
            const rawImages = item.banner_images || [];
            const parsedImages = rawImages.map((raw) => parseBannerImage(raw));
            const totalImages = parsedImages.length;
            const currentImgIndex = (activeImageIndexes[item.id] || 0) % (totalImages || 1);
            const currentImg = parsedImages[currentImgIndex] || { url: '', alt: '' };

            return (
              <div
                key={item.id}
                className="glass-panel rounded-2xl border border-sky-100/90 hover:border-sky-300 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden shadow-sm group bg-white"
              >
                {/* Image Preview Carousel Header */}
                <div className="relative w-full aspect-[16/9] bg-slate-900/90 overflow-hidden select-none">
                  {currentImg.url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentImg.url}
                        alt={currentImg.alt || item.subject || 'Banner image'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" fill="%230f172a"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="%2364748b">Image Preview Unavailable</text></svg>';
                        }}
                      />
                      {/* Enlarge / Full view button */}
                      <button
                        onClick={() => setLightboxImage(currentImg)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/50 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100"
                        title="View Full Image"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
                      <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[11px]">No image attached</span>
                    </div>
                  )}

                  {/* Multiple Images Navigation Controls */}
                  {totalImages > 1 && (
                    <>
                      <button
                        onClick={(e) => handlePrevImage(item.id, totalImages, e)}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all opacity-80 hover:opacity-100"
                        title="Previous Image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleNextImage(item.id, totalImages, e)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm transition-all opacity-80 hover:opacity-100"
                        title="Next Image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {/* Dots */}
                      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
                        {parsedImages.map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`h-1.5 rounded-full transition-all ${
                              dotIdx === currentImgIndex
                                ? 'w-4 bg-lime-400'
                                : 'w-1.5 bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Multi-image count badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-slate-950/70 text-white backdrop-blur-md border border-white/10 font-mono">
                      <Layers className="w-3 h-3 text-sky-400" />
                      <span>
                        {totalImages} {totalImages === 1 ? 'Image' : 'Images'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Header Info: Date & ID */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      {item.created_at ? (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                          <Calendar className="w-3 h-3 text-sky-600" />
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Banner #{item.id}</span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400">ID #{item.id}</span>
                    </div>

                    {/* Subject */}
                    {item.subject ? (
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-2">
                        {item.subject}
                      </h3>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 italic">
                        <span>(No subject title)</span>
                      </div>
                    )}

                    {/* Description */}
                    {item.description ? (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        No description provided.
                      </p>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                      {currentImg.alt || 'Promotional Banner'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setIsEditorOpen(true);
                        }}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 transition-colors"
                        title="Edit Banner"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Delete Banner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
      <BannerEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        announcement={editingItem}
        onSaved={(saved) => {
          setAnnouncements((prev) => {
            const exists = prev.some((a) => a.id === saved.id);
            if (exists) {
              return prev.map((a) => (a.id === saved.id ? saved : a));
            }
            return [saved, ...prev];
          });
          setMeta((prev) => ({
            ...prev,
            total_count: prev.total_count + (editingItem ? 0 : 1),
          }));
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border border-rose-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Delete Banner Announcement?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove {deletingItem.subject ? `"${deletingItem.subject}"` : 'this banner announcement'}? The banner will no longer appear in congregation mobile feeds.
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

      {/* Lightbox / Full-size Image Preview Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-default flex flex-col"
          >
            <div className="flex items-center justify-between p-3 bg-black/60 text-white text-xs px-4">
              <span className="font-semibold truncate">{lightboxImage.alt || 'Banner Image Preview'}</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] flex items-center justify-center bg-black/40 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxImage.url}
                alt={lightboxImage.alt || 'Full size banner'}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-2.5 bg-black/60 text-white/60 text-[11px] font-mono px-4 truncate">
              {lightboxImage.url}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
