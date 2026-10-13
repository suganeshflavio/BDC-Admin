'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FeedbackQuestion,
  FeedbackAnswer,
  PaginationMeta,
} from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import FeedbackQuestionModal from './FeedbackQuestionModal';
import {
  MessageSquareQuote,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Smartphone,
  Phone,
  Calendar,
  AlertCircle,
  ArrowRight,
  Eye,
} from 'lucide-react';

export default function FeedbackManager() {
  const { successToast, errorToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'questions' | 'answers'>('questions');

  // --- Questions State ---
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [questionsMeta, setQuestionsMeta] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });
  const [questionsPage, setQuestionsPage] = useState<number>(1);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState<boolean>(true);
  const [questionSearch, setQuestionSearch] = useState<string>('');

  // Modals for Questions
  const [isEditorModalOpen, setIsEditorModalOpen] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<FeedbackQuestion | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<FeedbackQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // --- Answers State ---
  const [answers, setAnswers] = useState<FeedbackAnswer[]>([]);
  const [answersMeta, setAnswersMeta] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });
  const [answersPage, setAnswersPage] = useState<number>(1);
  const [isAnswersLoading, setIsAnswersLoading] = useState<boolean>(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | 'all'>('all');
  const [deviceIdFilter, setDeviceIdFilter] = useState<string>('');
  const [answerSearch, setAnswerSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Questions
  const fetchQuestions = useCallback(
    async (page = 1) => {
      setIsQuestionsLoading(true);
      try {
        const res = await api.adminFeedback.listQuestions(page);
        const list = res.feedback_questions || [];
        setQuestions(list);
        if (res.meta) {
          setQuestionsMeta(res.meta);
          setQuestionsPage(res.meta.current_page || page);
        } else {
          setQuestionsMeta({
            current_page: page,
            total_pages: 1,
            total_count: list.length,
          });
        }
      } catch (err: unknown) {
        console.error('Error fetching feedback questions:', err);
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Failed to load feedback questions';
        errorToast(msg);
      } finally {
        setIsQuestionsLoading(false);
      }
    },
    [errorToast]
  );

  // Fetch Answers
  const fetchAnswers = useCallback(
    async (page = 1, questionId: number | 'all' = selectedQuestionId, deviceId = deviceIdFilter) => {
      setIsAnswersLoading(true);
      try {
        let res;
        if (questionId === 'all') {
          res = await api.adminFeedback.getAllAnswers(page, deviceId.trim() || undefined);
        } else {
          res = await api.adminFeedback.getQuestionAnswers(
            questionId,
            page,
            deviceId.trim() || undefined
          );
        }

        const list = res.feedback_answers || [];
        setAnswers(list);
        if (res.meta) {
          setAnswersMeta(res.meta);
          setAnswersPage(res.meta.current_page || page);
        } else {
          setAnswersMeta({
            current_page: page,
            total_pages: 1,
            total_count: list.length,
          });
        }
      } catch (err: unknown) {
        console.error('Error fetching feedback answers:', err);
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : 'Failed to load feedback answers';
        errorToast(msg);
      } finally {
        setIsAnswersLoading(false);
      }
    },
    [selectedQuestionId, deviceIdFilter, errorToast]
  );

  useEffect(() => {
    fetchQuestions(questionsPage);
  }, [fetchQuestions, questionsPage]);

  useEffect(() => {
    if (activeSubTab === 'answers') {
      fetchAnswers(answersPage, selectedQuestionId, deviceIdFilter);
    }
  }, [activeSubTab, fetchAnswers, answersPage, selectedQuestionId, deviceIdFilter]);

  const handleToggleQuestionActive = async (q: FeedbackQuestion) => {
    try {
      const updated = await api.adminFeedback.updateQuestion(q.id, {
        question_text: q.question_text,
        description: q.description || undefined,
        position: q.position,
        active: !q.active,
      });
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, active: updated.active } : item))
      );
      successToast(
        updated.active ? 'Question set to active.' : 'Question deactivated (hidden from members).'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update question status';
      errorToast(msg);
    }
  };

  const handleDeleteQuestionConfirm = async () => {
    if (!deletingQuestion) return;
    setIsDeleting(true);
    try {
      await api.adminFeedback.deleteQuestion(deletingQuestion.id);
      setQuestions((prev) => prev.filter((item) => item.id !== deletingQuestion.id));
      setQuestionsMeta((prev) => ({
        ...prev,
        total_count: Math.max(0, prev.total_count - 1),
      }));
      successToast('Feedback question removed successfully.');
      setDeletingQuestion(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete question';
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

  const handleViewAnswersForQuestion = (q: FeedbackQuestion) => {
    setSelectedQuestionId(q.id);
    setAnswersPage(1);
    setActiveSubTab('answers');
  };

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const s = questionSearch.toLowerCase().trim();
    if (!s) return true;
    return (
      q.question_text.toLowerCase().includes(s) ||
      (q.description && q.description.toLowerCase().includes(s))
    );
  });

  // Filtered Answers
  const filteredAnswers = answers.filter((a) => {
    const s = answerSearch.toLowerCase().trim();
    if (!s) return true;
    return (
      a.answer_text.toLowerCase().includes(s) ||
      (a.question_text && a.question_text.toLowerCase().includes(s)) ||
      (a.user?.name && a.user.name.toLowerCase().includes(s)) ||
      (a.user?.email && a.user.email.toLowerCase().includes(s)) ||
      (a.device_id && a.device_id.toLowerCase().includes(s))
    );
  });

  const activeQuestionsCount = questions.filter((q) => q.active).length;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 text-white shadow-xl shadow-sky-950/10 border border-sky-400/20">
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-lime-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm">
              <MessageSquareQuote className="w-3.5 h-3.5 text-lime-300" />
              <span>Congregation Survey & Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Feedback & Survey
            </h1>
            <p className="text-sm text-sky-100 max-w-xl">
              Create feedback questionnaires for conventions, church services, and choir ministry,
              and review member responses in real-time.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {activeSubTab === 'questions' && (
              <button
                onClick={() => {
                  setEditingQuestion(null);
                  setIsEditorModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-lime-950/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeSubTab === 'questions') {
                  fetchQuestions(questionsPage);
                } else {
                  fetchAnswers(answersPage, selectedQuestionId, deviceIdFilter);
                }
              }}
              disabled={isQuestionsLoading || isAnswersLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/30 text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <RefreshCw
                className={`w-4 h-4 text-lime-300 ${
                  isQuestionsLoading || isAnswersLoading ? 'animate-spin' : ''
                }`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-sky-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Questions</span>
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {questionsMeta.total_count || questions.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Configured questions</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Active Questions</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {activeQuestionsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Shown in member app</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-indigo-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">Responses Received</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-2">
            {answersMeta.total_count || answers.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Member submissions</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-100 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Inactive Drafts</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
            {Math.max(0, questions.length - activeQuestionsCount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Hidden from members</p>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex items-center gap-2 border-b border-sky-100 pb-2">
        <button
          onClick={() => setActiveSubTab('questions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'questions'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Survey Questions</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'questions' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {questions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('answers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'answers'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-600 hover:text-sky-700 hover:bg-sky-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Member Responses</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeSubTab === 'answers' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {answersMeta.total_count || answers.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SURVEY QUESTIONS */}
      {activeSubTab === 'questions' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-sky-100 bg-white/80 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions or descriptions..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="text-xs text-slate-500 hidden sm:block font-mono">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
          </div>

          {isQuestionsLoading ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-500">Loading questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-3 bg-white/70 border border-dashed border-slate-300">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Feedback Questions Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {questionSearch
                  ? 'No questions matched your search criteria.'
                  : 'Start by creating your first feedback question for members to answer.'}
              </p>
              {!questionSearch && (
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsEditorModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs shadow-md shadow-sky-600/20 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Question</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="glass-panel p-4 sm:p-5 rounded-2xl border border-sky-100 bg-white/90 hover:border-sky-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Position & Question details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 text-sky-700 font-mono font-bold text-xs shrink-0 shadow-sm">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">Pos</span>
                      <span>#{q.position ?? 1}</span>
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            q.active
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {q.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              <span>Inactive (Draft)</span>
                            </>
                          )}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">ID #{q.id}</span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {q.question_text}
                      </h3>

                      {q.description && (
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          {q.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    <button
                      onClick={() => handleViewAnswersForQuestion(q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs border border-sky-200/70 transition-colors"
                      title="View submitted answers for this question"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Answers</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => handleToggleQuestionActive(q)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        q.active
                          ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                      title={q.active ? 'Hide question from app' : 'Publish question in app'}
                    >
                      {q.active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setIsEditorModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 border border-slate-200 transition-colors"
                      title="Edit question"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingQuestion(q)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Questions Pagination */}
          {questionsMeta.total_pages > 1 && (
            <div className="flex items-center justify-between glass-panel p-3 sm:p-4 rounded-2xl border border-sky-100">
              <span className="text-xs text-slate-500 font-mono">
                Page {questionsMeta.current_page} of {questionsMeta.total_pages} (Total{' '}
                {questionsMeta.total_count} questions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuestionsPage((p) => Math.max(1, p - 1))}
                  disabled={questionsMeta.current_page <= 1 || isQuestionsLoading}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 px-2">{questionsMeta.current_page}</span>
                <button
                  onClick={() => setQuestionsPage((p) => Math.min(questionsMeta.total_pages, p + 1))}
                  disabled={questionsMeta.current_page >= questionsMeta.total_pages || isQuestionsLoading}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEMBER RESPONSES FEED */}
      {activeSubTab === 'answers' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-sky-100 bg-white/80 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Question Dropdown */}
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={selectedQuestionId}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    setSelectedQuestionId(val);
                    setAnswersPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                >
                  <option value="all">Across All Questions (Flat Feed)</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      #{q.position || q.id}: {q.question_text.slice(0, 45)}
                      {q.question_text.length > 45 ? '...' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search text */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search in answers, submitter name, or email..."
                  value={answerSearch}
                  onChange={(e) => setAnswerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Device ID Filter Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by device ID..."
                  value={deviceIdFilter}
                  onChange={(e) => {
                    setDeviceIdFilter(e.target.value);
                    setAnswersPage(1);
                  }}
                  className="w-44 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-800 placeholder:text-slate-400"
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

          {/* Answers Feed */}
          {isAnswersLoading ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-500">Loading member answers...</p>
            </div>
          ) : filteredAnswers.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-3 bg-white/70 border border-dashed border-slate-300">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Feedback Answers Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {answerSearch || deviceIdFilter || selectedQuestionId !== 'all'
                  ? 'No submissions matched your filter. Try clearing your filters or selecting all questions.'
                  : 'Answers submitted by church members will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredAnswers.map((ans) => {
                const submitterName = ans.user?.name || 'Anonymous Guest';
                const submitterEmail = ans.user?.email || null;
                const submitterPhone = ans.user?.phone || null;

                return (
                  <div
                    key={ans.id}
                    className="glass-panel p-4 sm:p-5 rounded-2xl border border-sky-100 bg-white/95 hover:border-sky-200 transition-all space-y-3"
                  >
                    {/* Header: Question title & timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-mono text-[10px] font-bold">
                          Q#{ans.feedback_question_id}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {ans.question_text ||
                            questions.find((q) => q.id === ans.feedback_question_id)?.question_text ||
                            'Question Prompt'}
                        </span>
                      </div>

                      {ans.updated_at && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(ans.updated_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Body: Answer text styled as quote */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50/60 to-blue-50/30 border border-sky-100/80 text-slate-800 text-sm leading-relaxed font-normal whitespace-pre-wrap">
                      <p className="italic">“{ans.answer_text}”</p>
                    </div>

                    {/* Submitter & Device Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      {/* Submitter profile */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-xs">
                          {submitterName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">{submitterName}</span>
                          {submitterEmail && (
                            <span className="text-slate-400 text-[11px] ml-1.5">
                              ({submitterEmail})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Device & Phone pill */}
                      <div className="flex items-center gap-2">
                        {submitterPhone && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <a href={`tel:${submitterPhone}`} className="hover:text-sky-600">
                              {submitterPhone}
                            </a>
                          </div>
                        )}

                        {ans.device_id && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-mono">
                            <Smartphone className="w-3 h-3 text-slate-400" />
                            <span>Device: {ans.device_id.slice(0, 10)}...</span>
                            <button
                              onClick={() => handleCopy(ans.device_id, `ans-dev-${ans.id}`)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 ml-0.5"
                              title="Copy device ID"
                            >
                              {copiedId === `ans-dev-${ans.id}` ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Answers Pagination */}
          {answersMeta.total_pages > 1 && (
            <div className="flex items-center justify-between glass-panel p-3 sm:p-4 rounded-2xl border border-sky-100">
              <span className="text-xs text-slate-500 font-mono">
                Page {answersMeta.current_page} of {answersMeta.total_pages} (Total{' '}
                {answersMeta.total_count} answers)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAnswersPage((p) => Math.max(1, p - 1))}
                  disabled={answersMeta.current_page <= 1 || isAnswersLoading}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 px-2">{answersMeta.current_page}</span>
                <button
                  onClick={() => setAnswersPage((p) => Math.min(answersMeta.total_pages, p + 1))}
                  disabled={answersMeta.current_page >= answersMeta.total_pages || isAnswersLoading}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Question Create/Edit Modal */}
      <FeedbackQuestionModal
        isOpen={isEditorModalOpen}
        question={editingQuestion}
        onClose={() => setIsEditorModalOpen(false)}
        defaultPosition={questions.length + 1}
        onSaved={(saved) => {
          if (editingQuestion) {
            setQuestions((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
          } else {
            setQuestions((prev) => [...prev, saved]);
            setQuestionsMeta((prev) => ({
              ...prev,
              total_count: prev.total_count + 1,
            }));
          }
        }}
      />

      {/* Delete Question Confirmation Modal */}
      {deletingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Question?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete{' '}
                <strong className="text-slate-800">“{deletingQuestion.question_text}”</strong>?
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingQuestion(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteQuestionConfirm}
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
