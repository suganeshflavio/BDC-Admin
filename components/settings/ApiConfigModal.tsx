'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, Check, RefreshCw, Shield } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '@/lib/api';
import { useToast } from '@/context/toast-context';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiConfigModal({ isOpen, onClose }: ApiConfigModalProps) {
  const { successToast, errorToast } = useToast();
  const [baseUrl, setBaseUrlState] = useState(getApiBaseUrl());
  const [testingPing, setTestingPing] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBaseUrlState(getApiBaseUrl());
      setPingStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiBaseUrl(baseUrl);
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
        const errData = await res.json().catch(() => null);
        const serverMsg = errData?.error || errData?.message || `Server responded with HTTP ${res.status}`;
        setPingStatus(serverMsg);
        errorToast(serverMsg);
      }
    } catch {
      setPingStatus('Could not reach server. Please check your network or API Base URL.');
      errorToast('Connection timed out or refused.');
    } finally {
      setTestingPing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-sky-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">API & Environment Settings</h3>
              <p className="text-xs text-slate-500">Configure Song Book API endpoints</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              API Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrlState(e.target.value)}
                placeholder="https://bdc-lyrics.vercel.app/api/v1"
                className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono"
              />
              <button
                type="button"
                onClick={handleTestPing}
                disabled={testingPing}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
            </div>
            {pingStatus && (
              <p
                className={`text-xs mt-2 px-3 py-1.5 rounded-lg font-mono ${
                  pingStatus.includes('successfully')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {pingStatus}
              </p>
            )}
          </div>

          {/* PDF API Spec Reference Card */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              API Security Requirements
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
              <li>Auth Header: <code className="text-sky-700 bg-sky-100/70 px-1 py-0.5 rounded font-mono">Authorization: Bearer &lt;jwt&gt;</code></li>
              <li>Token Validity: 30 days session validity</li>
              <li>Role Check: Restricted to <code className="text-lime-800 bg-lime-100/70 px-1 py-0.5 rounded font-mono">role: &quot;admin&quot;</code></li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
