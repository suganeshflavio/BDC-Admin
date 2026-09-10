'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, Check, RefreshCw, Database, Shield } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, isDemoModeEnabled, setDemoModeEnabled } from '@/lib/api';
import { useToast } from '@/context/toast-context';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiConfigModal({ isOpen, onClose }: ApiConfigModalProps) {
  const { successToast, errorToast } = useToast();
  const [baseUrl, setBaseUrlState] = useState(getApiBaseUrl());
  const [demoMode, setDemoModeState] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBaseUrlState(getApiBaseUrl());
      setDemoModeState(isDemoModeEnabled());
      setPingStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiBaseUrl(baseUrl);
    setDemoModeEnabled(demoMode);
    successToast('API connection settings updated successfully.');
    onClose();
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    setPingStatus(null);
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/about_us`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setPingStatus(`Connected successfully! HTTP ${res.status}`);
        successToast('Server responded successfully!');
      } else {
        setPingStatus(`Server responded with HTTP ${res.status}`);
        errorToast(`Server responded with ${res.status}`);
      }
    } catch {
      setPingStatus('Could not reach server. Use Demo Mode if backend is not currently running.');
      errorToast('Connection timed out or refused.');
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/10 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">API & Environment Settings</h3>
              <p className="text-xs text-slate-400">Configure Song Book API endpoints and testing mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              API Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrlState(e.target.value)}
                placeholder="http://192.168.1.64:3099/api/v1"
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={testingPing}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
            </div>
            {pingStatus && (
              <p
                className={`text-xs mt-2 px-3 py-1.5 rounded-lg font-mono ${
                  pingStatus.includes('successfully')
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                }`}
              >
                {pingStatus}
              </p>
            )}
          </div>

          {/* Demo Mode Toggle */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">Interactive Demo Mode</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Offline Capable
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uses rich pre-loaded Tamil & Thanglish church songs, notifications, and ministry info. Enables full CRUD
                management even when your local backend server is stopped.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoModeState(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* PDF API Spec Reference Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              API Security Requirements
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-400">
              <li>Auth Header: <code className="text-indigo-300">Authorization: Bearer &lt;jwt&gt;</code></li>
              <li>Token Validity: 30 days session validity</li>
              <li>Role Check: Restricted to <code className="text-amber-300">role: &quot;admin&quot;</code></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
