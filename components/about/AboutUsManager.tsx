'use client';

import React, { useState, useEffect } from 'react';
import { AboutUs, AboutUsInput } from '@/lib/types';
import { api } from '@/lib/api';
import { useToast } from '@/context/toast-context';
import {
  Building2,
  Phone,
  Church,
  Save,
  RotateCcw,
  Smartphone,
} from 'lucide-react';

export default function AboutUsManager() {
  const { successToast, errorToast } = useToast();

  const [initialData, setInitialData] = useState<AboutUs | null>(null);
  const [churchName, setChurchName] = useState('');
  const [ministryName, setMinistryName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await api.aboutUs.get();
        setInitialData(data);
        setChurchName(data.church_name || '');
        setMinistryName(data.ministry_name || '');
        setContactNumber(data.contact_number || '');
        setDescription(data.description || '');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load About Us details';
        errorToast(msg);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [errorToast]);

  const handleReset = () => {
    if (initialData) {
      setChurchName(initialData.church_name || '');
      setMinistryName(initialData.ministry_name || '');
      setContactNumber(initialData.contact_number || '');
      setDescription(initialData.description || '');
      successToast('Form reset to saved church information.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchName.trim()) {
      errorToast('Church Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: AboutUsInput = {
        church_name: churchName.trim(),
        ministry_name: ministryName.trim(),
        contact_number: contactNumber.trim(),
        description: description.trim(),
      };

      const updated = await api.aboutUs.update(payload);
      setInitialData(updated);
      successToast('Church & ministry profile updated successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save changes';
      errorToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-slate-900/80 border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Admin / About Us
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Church & Ministry Information
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Update the congregation-facing profile, ministry overview, and pastoral helpline displayed in the mobile app.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading church details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-7 glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Church Name *
                </label>
                <div className="relative">
                  <Church className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="Bethesda Deliverance Church"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ministry Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={ministryName}
                    onChange={(e) => setMinistryName(e.target.value)}
                    placeholder="The Feet of Heavenly Father Ministries"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official Contact / Helpline Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="94436-94891"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ministry Mission & Overview (Tamil / English)
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="இந்த ஊழியத்தின் மூலமாக தேவனுடைய வார்த்தையை அறிவித்து..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed tamil-text"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Mobile App Preview */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Smartphone className="w-4 h-4 text-purple-400" />
                Live Congregation App Preview
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Sync
              </span>
            </div>

            <div className="bg-[#070b14] rounded-3xl p-5 border border-slate-800/90 shadow-2xl space-y-4">
              {/* Mock App Header */}
              <div className="text-center pb-3 border-b border-slate-800/80">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 mx-auto flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-900/50 mb-2">
                  <Church className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {churchName || 'Bethesda Deliverance Church'}
                </h3>
                <p className="text-xs text-purple-300 font-medium mt-0.5">
                  {ministryName || 'The Feet of Heavenly Father Ministries'}
                </p>
              </div>

              {/* Contact Card */}
              {contactNumber && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Prayer Helpline</div>
                      <div className="text-xs font-mono font-bold text-white">{contactNumber}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold">
                    Call Church
                  </span>
                </div>
              )}

              {/* Ministry Description */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="text-xs font-semibold text-slate-300">About Our Ministry</div>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed tamil-text">
                  {description || 'Ministry details and description will be displayed here for church members.'}
                </p>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-500">
                Preview reflects live screen in mobile app
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
