'use client';

import React, { useState, useEffect } from 'react';
import { FeedbackQuestion, FeedbackQuestionInput } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  MessageSquareQuote,
  X,
  HelpCircle,
  FileText,
  ListOrdered,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface FeedbackQuestionModalProps {
  isOpen: boolean;
  question: FeedbackQuestion | null;
  onClose: () => void;
  onSaved: (saved: FeedbackQuestion) => void;
  defaultPosition?: number;
}

export default function FeedbackQuestionModal({
  isOpen,
  question,
  onClose,
  onSaved,
  defaultPosition = 1,
}: FeedbackQuestionModalProps) {
  const { successToast, errorToast } = useToast();

  const [questionText, setQuestionText] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<number>(1);
  const [active, setActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text || '');
      setDescription(question.description || '');
      setPosition(question.position ?? 1);
      setActive(question.active ?? true);
    } else {
      setQuestionText('');
      setDescription('');
      setPosition(defaultPosition);
      setActive(true);
    }
    setFormError(null);
  }, [question, defaultPosition, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setFormError('Question text cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload: FeedbackQuestionInput = {
      question_text: questionText.trim(),
      description: description.trim() || undefined,
      position: Number(position) || 1,
      active,
    };

    try {
      let result: FeedbackQuestion;
      if (question?.id) {
        result = await api.adminFeedback.updateQuestion(question.id, payload);
        successToast('Feedback question updated successfully.');
      } else {
        result = await api.adminFeedback.createQuestion(payload);
        successToast('Feedback question created successfully.');
      }
      onSaved(result);
      onClose();
    } catch (err: unknown) {
      console.error('Error saving feedback question:', err);
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Failed to save question';
      setFormError(msg);
      errorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <MessageSquareQuote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {question ? 'Edit Feedback Question' : 'Create Feedback Question'}
              </h2>
              <p className="text-xs text-slate-500">
                Configure questions presented to church members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>Question Prompt *</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. What went particularly well during the convention?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Description / Subtext (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Share your suggestions or encouragement for our ministry team"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Position & Active Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                <span>Display Order Position</span>
              </label>
              <input
                type="number"
                min={1}
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-900"
              />
            </div>

            {/* Active Switch */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <span className="text-xs font-bold text-slate-700 block">Status</span>
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {active ? 'Active (Visible)' : 'Inactive (Draft)'}
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{question ? 'Save Changes' : 'Create Question'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
