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
      {/* Header Banner in Logo Ocean/Sky Gradient with Lime Accent */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 border border-sky-400/20 shadow-xl text-white relative overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 relative z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 text-white border border-white/30 backdrop-blur-md">
            Admin / About Us
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-lime-400 text-slate-950">
            Live Settings
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mt-2 relative z-10">
          Church & Ministry Information
        </h1>
        <p className="text-xs sm:text-sm text-sky-100 mt-1 relative z-10">
          Update the congregation-facing profile, ministry overview, and pastoral helpline displayed in the mobile app.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-sky-100 shadow-sm flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-600 rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-500">Loading church details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-sky-100 shadow-sm">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Church Name *
                </label>
                <div className="relative">
                  <Church className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={churchName}
                    onChange={(e) => setChurchName(e.target.value)}
                    placeholder="Bethesda Deliverance Church"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ministry Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ministryName}
                    onChange={(e) => setMinistryName(e.target.value)}
                    placeholder="The Feet of Heavenly Father Ministries"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Contact / Helpline Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="94436-94891"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ministry Mission & Overview (Tamil / English)
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="இந்த ஊழியத்தின் மூலமாக தேவனுடைய வார்த்தையை அறிவித்து..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 leading-relaxed tamil-text"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
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
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Smartphone className="w-4 h-4 text-sky-600" />
                Live Congregation App Preview
              </span>
              <span className="text-[10px] text-lime-700 font-semibold flex items-center gap-1 bg-lime-50 px-2 py-0.5 rounded-full border border-lime-200">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            <div className="bg-gradient-to-b from-sky-50/80 via-white to-slate-50 rounded-3xl p-5 border border-sky-200/80 shadow-xl space-y-4">
              {/* App Header Preview */}
              <div className="text-center pb-3 border-b border-sky-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-sky-600 to-blue-600 mx-auto flex items-center justify-center text-white font-bold text-lg shadow-md shadow-sky-500/30 mb-2">
                  <Church className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {churchName || 'Bethesda Deliverance Church'}
                </h3>
                <p className="text-xs text-sky-700 font-semibold mt-0.5">
                  {ministryName || 'The Feet of Heavenly Father Ministries'}
                </p>
              </div>

              {/* Contact Card */}
              {contactNumber && (
                <div className="p-3 rounded-xl bg-white border border-sky-100 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-lime-50 text-lime-700 border border-lime-200">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Prayer Helpline</div>
                      <div className="text-xs font-mono font-bold text-slate-900">{contactNumber}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-lime-100 text-lime-800 border border-lime-200 font-semibold">
                    Call Church
                  </span>
                </div>
              )}

              {/* Ministry Description */}
              <div className="p-3.5 rounded-xl bg-white border border-sky-100 shadow-sm space-y-2">
                <div className="text-xs font-semibold text-slate-900">About Our Ministry</div>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed tamil-text">
                  {description || 'Ministry details and description will be displayed here for church members.'}
                </p>
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400">
                Preview reflects live screen in mobile app
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
