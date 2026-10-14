'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Announcement, AnnouncementInput } from '@/lib/types';
import { api, parseBannerImage, formatBannerImageTag } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  X,
  Image as ImageIcon,
  Check,
  Trash2,
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
        const rawList = announcement.banner_images || [];
        if (rawList.length > 0) {
          const parsed = parseBannerImage(rawList[0]);
          const isData = parsed.url.startsWith('data:');
          setImages([
            {
              id: `${Date.now()}-0`,
              url: parsed.url,
              alt: parsed.alt || 'Banner image',
              isUploaded: isData,
            },
          ]);
          if (!isData) {
            setImageUrlInput(parsed.url);
            setImageAltInput(parsed.alt || '');
          } else {
            setImageUrlInput('');
            setImageAltInput(parsed.alt || '');
          }
        } else {
          setImages([]);
          setImageUrlInput('');
          setImageAltInput('');
        }
      } else {
        setSubject('');
        setDescription('');
        setImages([]);
        setImageUrlInput('');
        setImageAltInput('');
      }
      setInputMode('upload');
      setPreviewError(false);
      setErrorMsg(null);
    }
  }, [isOpen, announcement]);

  // Handle file selected or dropped - Validate 1 image at a time
  const processSelectedFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) {
        setErrorMsg('Please select a valid image file (PNG, JPG, WebP, GIF).');
        return;
      }

      // Validate: only 1 image at a time
      if (files.length > 1) {
        setErrorMsg('Please upload only 1 image at a time.');
        errorToast('Please upload only 1 image at a time.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setIsProcessingFiles(true);
      setErrorMsg(null);

      try {
        const item = await optimizeImageFile(files[0]);
        const newItem: BannerImageItem = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url: item.dataUrl,
          alt: item.name || 'Banner image',
          isUploaded: true,
        };

        // Enforce 1 image at a time
        setImages([newItem]);
        setImageUrlInput('');
        setImageAltInput('');
        successToast('Banner image uploaded successfully.');
      } catch {
        setErrorMsg('Failed to process image.');
        errorToast('Failed to load selected image.');
      } finally {
        setIsProcessingFiles(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [successToast, errorToast]
  );

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
      if (e.dataTransfer.files.length > 1) {
        setErrorMsg('Please upload only 1 image at a time.');
        errorToast('Please upload only 1 image at a time.');
        return;
      }
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  // Clipboard paste support for images - Validates 1 image at a time
  const handleModalPaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const imageFiles = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        e.preventDefault();
        if (imageFiles.length > 1) {
          setErrorMsg('Please upload only 1 image at a time.');
          errorToast('Please upload only 1 image at a time.');
          return;
        }
        processSelectedFiles(imageFiles);
      }
    }
  };

  // Handle URL input changes - Auto set image directly without requiring an "Add+" button
  const handleUrlInputChange = (value: string) => {
    setPreviewError(false);
    setErrorMsg(null);

    let finalUrl = value;
    let finalAlt = imageAltInput;

    if (value.includes('<img')) {
      const parsed = parseBannerImage(value);
      finalUrl = parsed.url;
      if (parsed.alt && !imageAltInput) {
        finalAlt = parsed.alt;
        setImageAltInput(parsed.alt);
      }
    }

    setImageUrlInput(finalUrl);

    const trimmed = finalUrl.trim();
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:image/')
    ) {
      setImages([
        {
          id: 'url-image',
          url: trimmed,
          alt: finalAlt.trim() || 'Banner image',
          isUploaded: false,
        },
      ]);
    } else if (!trimmed) {
      setImages((prev) => prev.filter((img) => img.isUploaded));
    }
  };

  const handleAltChange = (newAlt: string) => {
    setImageAltInput(newAlt);
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        alt: newAlt,
      }))
    );
  };

  const handleRemoveImage = () => {
    setImages([]);
    setImageUrlInput('');
    setImageAltInput('');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalImages = [...images];

    // Check if user entered URL that needs applying
    if (
      inputMode === 'url' &&
      imageUrlInput.trim() &&
      (imageUrlInput.startsWith('http://') || imageUrlInput.startsWith('https://'))
    ) {
      finalImages = [
        {
          id: 'url-image',
          url: imageUrlInput.trim(),
          alt: imageAltInput.trim() || 'Banner image',
          isUploaded: false,
        },
      ];
    }

    if (finalImages.length === 0) {
      errorToast('Please upload or provide 1 banner image.');
      setErrorMsg('1 banner image is required.');
      return;
    }

    // Validate only 1 image at a time
    if (finalImages.length > 1) {
      errorToast('Please upload only 1 image at a time.');
      setErrorMsg('Please upload only 1 image at a time.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Serialize single banner image tag: <img src="..." alt="..." />
      const serializedBannerImages = [
        formatBannerImageTag(finalImages[0].url, finalImages[0].alt),
      ];

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
                Upload 1 promotional banner image to display on the mobile app home screen
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
          {/* <div>
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
          </div> */}

          {/* Description Field (Optional) */}
          {/* <div>
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
          </div> */}

          {/* Banner Image Section (Required - 1 image at a time) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  Banner Image *
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload 1 image from your device or paste an image web link
                </p>
              </div>
              <div>
                {images.length === 1 ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    1 Image Selected
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    No image selected
                  </span>
                )}
              </div>
            </div>

            {/* Segmented Mode Control: Upload File vs Paste URL */}
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

            {/* Mode 1: Drag & Drop File Upload (Strictly 1 image at a time) */}
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
                {/* Single file input - multiple removed */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
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
                      Optimizing and preparing image...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-sky-100/70 group-hover:bg-sky-500 group-hover:text-white text-sky-600 flex items-center justify-center mb-2.5 transition-colors shadow-sm">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                      Click to browse or drag & drop 1 image here
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Upload 1 image (PNG, JPG, WebP, GIF). High-res photos are automatically optimized.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                        1 image at a time
                      </span>
                      <span>·</span>
                      <span>Paste from clipboard (Ctrl+V)</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mode 2: Paste URL Input (Add+ button removed - auto-syncs to banner image) */}
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

                  <div>
                    <input
                      type="text"
                      value={imageAltInput}
                      onChange={(e) => handleAltChange(e.target.value)}
                      placeholder="Image Alt Text / Label (e.g. Christmas Service Banner)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400"
                    />
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
                          Image URL verified and set as banner image.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Single Selected Banner Image Card */}
            {images.length > 0 ? (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
                  Selected Banner Image
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-sky-300 transition-colors flex items-center justify-between gap-3 group">
                  {/* Thumbnail Preview */}
                  <div className="relative w-20 h-14 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300/80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[0].url}
                      alt={images[0].alt || 'Banner thumbnail'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" fill="%23cbd5e1"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="9" fill="%2394a3b8">Error</text></svg>';
                      }}
                    />
                  </div>

                  {/* Info & Alt Text Input */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={images[0].alt}
                        onChange={(e) => handleAltChange(e.target.value)}
                        placeholder="Image label / Alt text"
                        className="text-xs font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-sky-500 focus:outline-none w-full truncate py-0.5"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <FileImage className="w-3 h-3 text-slate-400" />
                        {images[0].isUploaded ? 'Uploaded File' : 'Web URL'}
                      </span>
                      <span>·</span>
                      <span className="truncate max-w-[200px]">
                        {images[0].isUploaded ? 'Optimized Image' : images[0].url}
                      </span>
                    </div>
                  </div>

                  {/* Action: Remove */}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    title="Remove Image"
                    className="p-2 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No image selected yet. Please upload 1 image banner or enter an image URL.</span>
              </div>
            )}

            {/* Tips footer */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Recommended banner aspect ratio: <strong>16:9</strong> (landscape) or <strong>2:1</strong>. Displayed prominently at the top of the mobile app home screen.
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl">
          <span className="text-xs text-slate-500 font-mono">
            {images.length === 1 ? '1 image selected (Ready)' : '1 banner image required'}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="banner-form"
              disabled={isSubmitting || images.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
