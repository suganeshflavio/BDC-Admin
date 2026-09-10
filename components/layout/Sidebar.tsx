'use client';

import React from 'react';
import {
  LayoutDashboard,
  Music,
  Bell,
  Building2,
  ChevronRight,
  Shield,
  Users,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'songs' | 'notifications' | 'about' | 'users';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  songsCount?: number;
  notificationsCount?: number;
  usersCount?: number;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  songsCount = 0,
  notificationsCount = 0,
  usersCount = 0,
}: SidebarProps) {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics',
    },
    {
      id: 'songs' as NavTab,
      label: 'Songs Management',
      icon: Music,
      badge: songsCount > 0 ? songsCount : undefined,
      description: 'Lyrics, verses, publication',
    },
    {
      id: 'notifications' as NavTab,
      label: 'Notifications',
      icon: Bell,
      badge: notificationsCount > 0 ? notificationsCount : undefined,
      description: 'Worship links & announcements',
    },
    {
      id: 'users' as NavTab,
      label: 'User Management',
      icon: Users,
      badge: usersCount > 0 ? usersCount : undefined,
      description: 'Register & manage users',
    },
    {
      id: 'about' as NavTab,
      label: 'About Church',
      icon: Building2,
      description: 'Ministry & contact info',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 border-r border-slate-800/80 bg-[#090d16]/70 backdrop-blur-md p-4 min-h-[calc(100vh-4rem)]">
      {/* Navigation Group */}
      <div className="space-y-1.5 flex-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Admin Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-600/5 text-white border border-indigo-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <div className={`leading-snug truncate ${isActive ? 'font-semibold text-white' : ''}`}>
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate font-normal">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Admin PDF Spec Information Card */}
      {/* <div className="mt-auto pt-4 border-t border-slate-800/80">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Admin Endpoints Active</span>
          </div>
          <div className="text-[11px] text-slate-400 space-y-1 font-mono">
            <div className="flex items-center justify-between">
              <span>/admin/songs</span>
              <span className="text-emerald-400">CRUD</span>
            </div>
            <div className="flex items-center justify-between">
              <span>/admin/notifications</span>
              <span className="text-emerald-400">CRUD</span>
            </div>
            <div className="flex items-center justify-between">
              <span>/admin/about_us</span>
              <span className="text-amber-400">PUT</span>
            </div>
          </div>
        </div>
      </div> */}
    </aside>
  );
}
