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
      {/* Top Header Banner in Logo Ocean/Sky Gradient with Lime Accent */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 border border-sky-400/20 shadow-xl text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-lime-400/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  User Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-400 text-slate-950">
                  {meta.total_count || users.length} {meta.total_count === 1 ? 'Account' : 'Accounts'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-sky-100 mt-1">
                Register and manage admin and member accounts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchUsers(currentPage)}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors disabled:opacity-50 backdrop-blur-md"
              title="Refresh users list"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-lime-300' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchUsers(currentPage)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shrink-0 transition-colors"
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
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-xs sm:text-sm transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
          {(['all', 'admin', 'user'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                roleFilter === role
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
              className="p-5 rounded-2xl border border-sky-100 bg-white space-y-4 animate-pulse shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-slate-100 rounded w-28" />
                  <div className="h-2.5 bg-slate-100 rounded w-16" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-7 bg-slate-50 rounded-xl" />
                <div className="h-7 bg-slate-50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-sky-200 bg-white shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">No Users Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || roleFilter !== 'all'
              ? 'No user accounts match your active search filters.'
              : 'No users have been returned from the server.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
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
                className="p-5 rounded-2xl border border-sky-100 bg-white hover:border-sky-300 hover:shadow-md transition-all group flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div>
                  {/* Top Card Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 ${
                          isAdmin
                            ? 'bg-gradient-to-br from-sky-500 to-blue-600'
                            : 'bg-gradient-to-br from-lime-500 to-emerald-600'
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors flex items-center gap-1.5">
                          <span>{user.name}</span>
                          {isAdmin && (
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          )}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${
                              isAdmin
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {user.role || 'user'}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                              isActive
                                ? 'bg-lime-50 text-lime-800 border-lime-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? 'bg-lime-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{isActive ? 'Active' : 'Inactive'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      #{user.id}
                    </span>
                  </div>

                  {/* User Contact Details */}
                  <div className="mt-4 space-y-2 text-xs">
                    {/* Email */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">{user.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(user.email, `email-${user.id}`)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy email"
                      >
                        {copiedField === `email-${user.id}` ? (
                          <Check className="w-3.5 h-3.5 text-lime-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Phone */}
                    {user.phone && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700 font-mono text-[11px] truncate">
                            {user.phone}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(user.phone, `phone-${user.id}`)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy phone"
                        >
                          {copiedField === `phone-${user.id}` ? (
                            <Check className="w-3.5 h-3.5 text-lime-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Timestamp */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
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
                  <span className="text-[10px] font-mono text-slate-400">
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Page <span className="text-slate-900 font-semibold">{meta.current_page}</span> of{' '}
            <span className="text-slate-900 font-semibold">{meta.total_pages}</span> ({meta.total_count} total users)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={meta.current_page <= 1 || isLoading}
              onClick={() => fetchUsers(meta.current_page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={meta.current_page >= meta.total_pages || isLoading}
              onClick={() => fetchUsers(meta.current_page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
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
