'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, PaginationMeta } from '@/lib/types';
import { api, ApiError } from '@/lib/api';
import AddUserModal from './AddUserModal';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Calendar,
  Shield,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/context/toast-context';

export default function UserManager() {
  const { successToast, errorToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch users from live API (GET /auth/register?page=...)
  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.adminUsers.list(page);
      setUsers(res.users || []);
      if (res.meta) {
        setMeta(res.meta);
        setCurrentPage(res.meta.current_page || page);
      } else {
        setMeta({
          current_page: page,
          total_pages: 1,
          total_count: res.users?.length || 0,
        });
      }
    } catch (err: unknown) {
      console.error('Failed to fetch users:', err);
      let msg = 'Failed to load users from server.';
      if (err instanceof ApiError) {
        msg = err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      errorToast(msg);
    } finally {
      setIsLoading(false);
    }
  }, [errorToast]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleUserCreated = (newUser: User) => {
    // Refresh list from live API to display newly registered user
    fetchUsers(currentPage);
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Client-side filtering across current page
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all') {
      if (u.role?.toLowerCase() !== roleFilter) return false;
    }
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-[#090d16]/70 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-950/50">
              <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  User Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  {meta.total_count || users.length} {meta.total_count === 1 ? 'Account' : 'Accounts'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Register and manage admin and member accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchUsers(currentPage)}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-colors disabled:opacity-50"
              title="Refresh users list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchUsers(currentPage)}
            className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-rose-100 font-medium text-xs shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Role Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, or ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
          {(['all', 'admin', 'user'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {role === 'all' ? 'All Roles' : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-[#0d1322]/80 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-800 rounded w-28" />
                  <div className="h-2.5 bg-slate-800 rounded w-16" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-7 bg-slate-800/60 rounded-xl" />
                <div className="h-7 bg-slate-800/60 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Users Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || roleFilter !== 'all'
              ? 'No user accounts match your active search filters.'
              : 'No users have been returned from the server.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add First User</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
            const isAdmin = user.role?.toLowerCase() === 'admin';
            const isActive = user.active !== false;

            return (
              <div
                key={user.id || user.email}
                className="glass-panel p-5 rounded-2xl border border-slate-800/90 bg-[#0d1322]/80 hover:border-slate-700 transition-all group flex flex-col justify-between space-y-4 shadow-lg shadow-black/20"
              >
                <div>
                  {/* Top Card Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 ${
                          isAdmin
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-950/40'
                            : 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-950/40'
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {isAdmin && (
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                              isAdmin
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {user.role || 'user'}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      #{user.id}
                    </span>
                  </div>

                  {/* User Contact Details */}
                  <div className="mt-4 space-y-2 text-xs">
                    {/* Email */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-200 truncate">{user.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(user.email, `email-${user.id}`)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Copy email"
                      >
                        {copiedField === `email-${user.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Phone */}
                    {user.phone && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-200 font-mono text-[11px] truncate">
                            {user.phone}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(user.phone, `phone-${user.id}`)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Copy phone"
                        >
                          {copiedField === `phone-${user.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Timestamp */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Registered'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    ID #{user.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {meta.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Page <span className="text-white font-semibold">{meta.current_page}</span> of{' '}
            <span className="text-white font-semibold">{meta.total_pages}</span> ({meta.total_count} total users)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || isLoading}
              onClick={() => fetchUsers(meta.current_page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.total_pages || isLoading}
              onClick={() => fetchUsers(meta.current_page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
}
