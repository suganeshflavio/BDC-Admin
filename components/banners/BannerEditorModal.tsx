'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Announcement, AnnouncementInput } from '@/lib/types';
import { api, parseBannerImage, formatBannerImageTag } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  X,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Sparkles,
  HelpCircle,
  UploadCloud,
  Link as LinkIcon,
  FileImage,
  Loader2,
} from 'lucide-react';

interface BannerEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  onSaved: (savedItem: Announcement) => void;
}

interface BannerImageItem {
  id: string;
  url: string;
  alt: string;
  isUploaded?: boolean;
}

// Client-side image optimizer to convert large phone/camera files into web-friendly data URLs
async function optimizeImageFile(file: File): Promise<{ dataUrl: string; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read file'));
        return;
      }

      // If it's a small image (< 250KB) or GIF/SVG, preserve directly
      if (file.size < 250 * 1024 || file.type === 'image/gif' || file.type === 'image/svg+xml') {
        resolve({ dataUrl: result, name: file.name.replace(/\.[^/.]+$/, '') });
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: result, name: file.name.replace(/\.[^/.]+$/, '') });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress as JPEG with 0.82 quality
        const optimized = canvas.toDataURL('image/jpeg', 0.82);
        resolve({ dataUrl: optimized, name: file.name.replace(/\.[^/.]+$/, '') });
      };
      img.onerror = () => resolve({ dataUrl: result, name: file.name.replace(/\.[^/.]+$/, '') });
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BannerEditorModal({
  isOpen,
  onClose,
  announcement,
  onSaved,
}: BannerEditorModalProps) {
  const { successToast, errorToast } = useToast();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<BannerImageItem[]>([]);

  // Tab mode: 'upload' or 'url'
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');

  // URL input state
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageAltInput, setImageAltInput] = useState('');
  const [previewError, setPreviewError] = useState(false);

  // Drag and drop / file upload state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        setSubject(announcement.subject || '');
        setDescription(announcement.description || '');
        const parsedImages: BannerImageItem[] = (announcement.banner_images || []).map(
          (rawTagOrUrl, index) => {
            const parsed = parseBannerImage(rawTagOrUrl);
            return {
              id: `${Date.now()}-${index}`,
              url: parsed.url,
              alt: parsed.alt || `Banner ${index + 1}`,
              isUploaded: parsed.url.startsWith('data:'),
            };
          }
        );
        setImages(parsedImages);
      } else {
        setSubject('');
        setDescription('');
        setImages([]);
      }
      setInputMode('upload');
      setImageUrlInput('');
      setImageAltInput('');
      setPreviewError(false);
      setErrorMsg(null);
    }
  }, [isOpen, announcement]);

  // Handle files selected or dropped
  const processSelectedFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
      setErrorMsg('Please select valid image files (PNG, JPG, WebP, GIF).');
      return;
    }

    setIsProcessingFiles(true);
    setErrorMsg(null);

    try {
      const processed = await Promise.all(files.map((file) => optimizeImageFile(file)));
      const newItems: BannerImageItem[] = processed.map((item, idx) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${idx}`,
        url: item.dataUrl,
        alt: item.name || `Banner image ${images.length + idx + 1}`,
        isUploaded: true,
      }));

      setImages((prev) => [...prev, ...newItems]);
      successToast(`Added ${newItems.length} image${newItems.length > 1 ? 's' : ''}`);
    } catch {
      setErrorMsg('Failed to process one or more images.');
      errorToast('Failed to load selected images.');
    } finally {
      setIsProcessingFiles(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [images.length, successToast, errorToast]);

  // Drag & Drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  // Clipboard paste support for images
  const handleModalPaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const imageFiles = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length > 0) {
        e.preventDefault();
        processSelectedFiles(imageFiles);
      }
    }
  };

  // Handle URL input changes - auto detect if user pasted a full <img src="..." alt="..." /> tag
  const handleUrlInputChange = (value: string) => {
    setPreviewError(false);
    setErrorMsg(null);
    if (value.includes('<img')) {
      const parsed = parseBannerImage(value);
      setImageUrlInput(parsed.url);
      if (parsed.alt && !imageAltInput) {
        setImageAltInput(parsed.alt);
      }
    } else {
      setImageUrlInput(value);
    }
  };

  const handleAddUrlImage = () => {
    const trimmedUrl = imageUrlInput.trim();
    if (!trimmedUrl) {
      setErrorMsg('Please enter an image URL.');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('data:image/')) {
      setErrorMsg('Image URL must start with http://, https://, or be a valid data URI');
      return;
    }

    const newImage: BannerImageItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: trimmedUrl,
      alt: imageAltInput.trim() || `Banner ${images.length + 1}`,
      isUploaded: false,
    };

    setImages((prev) => [...prev, newImage]);
    setImageUrlInput('');
    setImageAltInput('');
    setPreviewError(false);
    setErrorMsg(null);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleClearAllImages = () => {
    if (window.confirm('Are you sure you want to remove all banner images?')) {
      setImages([]);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleAltChange = (id: string, newAlt: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, alt: newAlt } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user has an un-added image in the URL input
    const finalImages = [...images];
    if (
      inputMode === 'url' &&
      imageUrlInput.trim() &&
      (imageUrlInput.startsWith('http://') || imageUrlInput.startsWith('https://'))
    ) {
      finalImages.push({
        id: `${Date.now()}`,
        url: imageUrlInput.trim(),
        alt: imageAltInput.trim() || `Banner ${images.length + 1}`,
        isUploaded: false,
      });
    }

    if (finalImages.length === 0) {
      errorToast('Please upload or add at least one banner image.');
      setErrorMsg('At least one banner image is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Serialize to array of <img src="..." alt="..." /> as specified in API contract
      const serializedBannerImages = finalImages.map((img) =>
        formatBannerImageTag(img.url, img.alt)
      );

      const payload: AnnouncementInput = {
        subject: subject.trim() || null,
        description: description.trim() || null,
        banner_images: serializedBannerImages,
      };

      let result: Announcement;
      if (announcement) {
        result = await api.adminAnnouncements.update(announcement.id, payload);
        successToast('Banner image announcement updated successfully.');
      } else {
        result = await api.adminAnnouncements.create(payload);
        successToast('Banner image announcement published successfully!');
      }

      onSaved(result);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save announcement';
      setErrorMsg(msg);
      errorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  const isEditing = !!announcement;

  return (
    <div
      onPaste={handleModalPaste}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-sky-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/20">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Banner Announcement' : 'Create Banner Announcement'}
              </h2>
              <p className="text-xs text-slate-500">
                Upload images or paste URLs to display promotional carousel banners in the mobile app
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

        {/* Modal Form */}
        <form
          id="banner-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Subject Field (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Subject / Title
              </label>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Christmas Service 2026 / சிறப்பு ஆராதனை"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400"
            />
          </div>

          {/* Description Field (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Description / Message
              </label>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Join us for a special Christmas celebration with praise and worship!"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Banner Images Section (Required) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  Banner Images *
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload multiple photos from your device or paste web links
                </p>
              </div>
              <div className="flex items-center gap-2">
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={handleClearAllImages}
                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:underline font-medium"
                  >
                    Clear All
                  </button>
                )}
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                  {images.length} added
                </span>
              </div>
            </div>

            {/* Segmented Mode Control: Upload Files vs Paste URL */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 max-w-sm">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'upload'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload From Device</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'url'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Paste Image URL</span>
              </button>
            </div>

            {/* Mode 1: Drag & Drop File Upload */}
            {inputMode === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50/60 hover:bg-sky-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processSelectedFiles(e.target.files);
                    }
                  }}
                  className="hidden"
                />

                {isProcessingFiles ? (
                  <div className="py-3 flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-700">
                      Optimizing and preparing images...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-sky-100/70 group-hover:bg-sky-500 group-hover:text-white text-sky-600 flex items-center justify-center mb-2.5 transition-colors shadow-sm">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                      Click to browse or drag & drop images here
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Select one or multiple images at once (PNG, JPG, WebP, GIF). High-res photos are automatically optimized.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                        Multiple files supported
                      </span>
                      <span>·</span>
                      <span>Paste from clipboard (Ctrl+V)</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mode 2: Paste URL Input */}
            {inputMode === 'url' && (
              <div className="p-3.5 rounded-2xl bg-sky-50/50 border border-sky-100/80 space-y-3">
                <div className="text-xs font-semibold text-sky-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Enter Image Web URL or &lt;img /&gt; tag</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => handleUrlInputChange(e.target.value)}
                      placeholder="https://example.com/banner.jpg or <img src='...' />"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm font-mono focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageAltInput}
                      onChange={(e) => setImageAltInput(e.target.value)}
                      placeholder="Image Alt Text (e.g. Christmas Service Banner)"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrlImage}
                      disabled={!imageUrlInput.trim()}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Live Preview Box when typing URL */}
                {imageUrlInput.trim().startsWith('http') && (
                  <div className="pt-2 border-t border-sky-100 flex items-center gap-3">
                    <div className="w-24 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden relative shadow-inner shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrlInput.trim()}
                        alt="Live preview"
                        className="w-full h-full object-cover"
                        onError={() => setPreviewError(true)}
                        onLoad={() => setPreviewError(false)}
                      />
                    </div>
                    <div className="text-xs">
                      {previewError ? (
                        <span className="text-rose-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Cannot load image from this URL.
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Image URL verified.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List of Added / Uploaded Images */}
            {images.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pt-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                  Selected Carousel Images ({images.length})
                </div>
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-sky-300 transition-colors flex items-center justify-between gap-3 group"
                  >
                    {/* Thumbnail Preview */}
                    <div className="relative w-16 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300/80">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.alt || 'Banner thumbnail'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" fill="%23cbd5e1"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="9" fill="%2394a3b8">Error</text></svg>';
                        }}
                      />
                      <span className="absolute bottom-0.5 right-0.5 px-1 rounded text-[9px] font-bold bg-slate-900/70 text-white font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Info & Alt Text Input */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img.alt}
                          onChange={(e) => handleAltChange(img.id, e.target.value)}
                          placeholder="Image label / Alt text"
                          className="text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none w-full truncate py-0.5"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <FileImage className="w-3 h-3 text-slate-400" />
                          {img.isUploaded ? 'Uploaded File' : 'Web URL'}
                        </span>
                        <span>·</span>
                        <span className="truncate max-w-[180px]">
                          {img.isUploaded ? 'Data URL (Ready)' : img.url}
                        </span>
                      </div>
                    </div>

                    {/* Actions: Reorder & Remove */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-opacity"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === images.length - 1}
                        title="Move Down"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-opacity"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        title="Remove Image"
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No images added yet. Please upload or paste at least one image banner.</span>
              </div>
            )}

            {/* Tips footer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Recommended banner aspect ratio: <strong>16:9</strong> (landscape) or <strong>2:1</strong>. When multiple images are added, the congregation mobile app slides between them automatically.
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
          <span className="text-xs text-slate-500 font-mono">
            {images.length} {images.length === 1 ? 'image' : 'images'} in banner
          </span>
          <div className="flex items-center gap-2.5">
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
              form="banner-form"
              disabled={isSubmitting || images.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Save Changes' : 'Publish Banner Announcement'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
