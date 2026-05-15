'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Pencil, MapPin, Home, Share2, ShieldCheck, Globe, Phone, Mail, LogOut } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { uploadProfilePicAction } from '@/app/actions/profile';
import { encryptData, decryptData } from '@/lib/crypto';
import { UserAvatar } from '@/components/ui/user-avatar';

const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), { ssr: false });

interface InstitutionHeaderProps {
  institution: any;
  onUpdate: (data: any) => void;
  isEditing: boolean;
  setEditing: (val: boolean) => void;
}

export default function InstitutionHeader({ institution, onUpdate, isEditing, setEditing }: InstitutionHeaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [headerData, setHeaderData] = useState({
    name: institution.name || '',
    type: institution.type || '',
    address: institution.address || '',
    email: institution.email || '',
    phone: institution.phone || '',
    website: institution.website || '',
    hire_status: institution.hire_status || false,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    router.push('/');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("File limit: 2MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      // Using the profile pic upload for institution logo
      const payload = { userId: institution.auth_id, base64Image: reader.result as string, fileName: file.name };
      const res = decryptData(await uploadProfilePicAction(encryptData(payload)));
      if (res?.success) {
        toast.success("Logo updated!");
        onUpdate({ ...institution, profile_pic_url: res.profilePicUrl });
      } else { toast.error("Upload failed."); }
      setUploading(false);
    };
  };

  const handleLocationSelect = (address: string) => {
    setHeaderData(prev => ({ ...prev, address: address }));
    setShowMap(false);
  };

  const handleSave = () => {
    onUpdate({
      ...institution,
      name: headerData.name,
      type: headerData.type,
      address: headerData.address,
      email: headerData.email,
      phone: headerData.phone,
      website: headerData.website,
      hire_status: headerData.hire_status
    });
    setEditing(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-md shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 relative"
      >
        {/* ── BANNER ─────────────────────── */}
        <div className="h-28 sm:h-36 md:h-44 bg-gradient-to-br from-[#1b2a4e] to-[#0d163a] relative overflow-hidden rounded-t-md">
          <motion.div
            animate={{ x: [0, 40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[-60%] left-[-20%] w-[140%] h-[200%] opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-secondary)_0%,_transparent_60%)]"
          />
          <div className="absolute top-3 right-4 flex items-center gap-1.5 text-white/25 text-xs font-medium select-none">
            <ShieldCheck size={9} />
            <span className="capitalize hidden sm:inline">Institution verified</span>
          </div>
        </div>

        {/* ── LOGO ── */}
        <div className="absolute left-4 sm:left-6 top-[calc(7rem-2.5rem)] sm:top-[calc(9rem-3rem)] md:top-[calc(11rem-3.5rem)] z-20">
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/10 blur-md" />
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-md border-4 border-white shadow-xl bg-white">
            <div className="w-full h-full rounded-md overflow-hidden group/avatar relative bg-gray-50 flex items-center justify-center">
              <UserAvatar
                src={institution.profile_pic_url}
                name={institution.name || "Institution Name"}
                className={`w-full h-full rounded-md transition-all duration-500 ${uploading ? 'blur-sm opacity-40' : 'opacity-100'}`}
                fallbackClassName="text-4xl"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-all flex flex-col items-center justify-center text-white rounded-md cursor-pointer"
              >
                <Camera size={14} className="mb-0.5" />
                <span className="text-xs font-semibold capitalize">Update logo</span>
              </button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* ── INFO SECTION ── */}
        <div className="pt-14 sm:pt-20 md:pt-22 pb-5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="mt-4 min-w-0 space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight capitalize leading-tight text-[#0d163a]">
                  {institution.name || "Institution Name"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 text-[var(--color-primary)] text-xs font-bold rounded-md capitalize shadow-sm flex-shrink-0">
                  <Home size={8} />
                  {institution.type || "Institution"}
                </span>
                {institution.hire_status && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full shadow-sm"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-bold text-green-700">Hiring</span>
                  </motion.div>
                )}
              </div>
              <div className="h-0.5 w-20 rounded-full bg-gradient-to-r from-[var(--color-primary)]/50 to-transparent" />
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:mt-0 mt-2 pl-28 sm:pl-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setEditing(true)}
                className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/10 flex items-center gap-2 transition-all capitalize hover:translate-y-[-1px] active:translate-y-0"
              >
                <Pencil size={12} /> Edit profile
              </motion.button>
              <button title="Share Profile" className="p-2.5 bg-white text-gray-400 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all rounded-lg border border-gray-100 shadow-sm">
                <Share2 size={14} />
              </button>
              <button title="Sign Out" onClick={handleLogout} className="p-2.5 bg-white text-gray-400 hover:text-red-500 hover:border-red-100 transition-all rounded-lg border border-gray-100 shadow-sm">
                <LogOut size={14} />
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-gray-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-gray-300 flex-shrink-0" />
                <span className="text-xs font-medium capitalize">{institution.address || "Global base"}</span>
              </div>
              {institution.website && (
                <div className="flex items-center gap-1.5">
                  <Globe size={10} className="text-gray-300 flex-shrink-0" />
                  <a href={institution.website.startsWith('http') ? institution.website : `https://${institution.website}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--color-primary)] hover:underline">
                    {institution.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-4 text-gray-500">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Phone size={10} className="text-blue-400" />
                <span className="text-xs font-bold">{institution.phone || "No phone set"}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                <Mail size={10} className="text-blue-400" />
                <span className="text-xs font-bold">{institution.email || "No email set"}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Edit Sheet ──────────────────────────────────── */}
      <Sheet open={isEditing} onClose={() => setEditing(false)} title="Edit Institution Info" description="Basic identification & location">
        <div className="space-y-5 pb-20">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Institution name</label>
            <Input
              value={headerData.name}
              onChange={e => setHeaderData({ ...headerData, name: e.target.value })}
              className="rounded-md border-gray-200 h-9 text-xs font-medium bg-white text-gray-800"
              placeholder="e.g. Oxford University"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Institution type</label>
            <Input
              value={headerData.type}
              onChange={e => setHeaderData({ ...headerData, type: e.target.value })}
              className="rounded-md border-gray-200 h-9 text-xs font-medium bg-white text-gray-800"
              placeholder="e.g. University, School, College"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Official email</label>
            <Input
              value={headerData.email}
              onChange={e => setHeaderData({ ...headerData, email: e.target.value })}
              className="rounded-md border-gray-200 h-9 text-xs font-medium bg-white text-gray-800"
              placeholder="e.g. contact@oxford.edu"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Phone</label>
            <Input
              value={headerData.phone}
              onChange={e => setHeaderData({ ...headerData, phone: e.target.value })}
              className="rounded-md border-gray-200 h-9 text-xs font-medium bg-white text-gray-800"
              placeholder="e.g. +1 123 456 7890"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Website</label>
            <Input
              value={headerData.website}
              onChange={e => setHeaderData({ ...headerData, website: e.target.value })}
              className="rounded-md border-gray-200 h-9 text-xs font-medium bg-white text-gray-800"
              placeholder="e.g. www.oxford.ac.uk"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Address</label>
            <div className="flex items-start gap-2 p-3 bg-gray-50/30 border border-gray-100 rounded-md min-h-[50px]">
              <MapPin size={12} className={`mt-0.5 flex-shrink-0 ${headerData.address ? 'text-[var(--color-primary)]' : 'text-gray-300'}`} />
              <p className={`text-xs font-medium leading-relaxed ${headerData.address ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                {headerData.address || "No address set — use the map to pick one"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="w-full py-3.5 flex items-center justify-center gap-2.5 text-xs font-bold text-[var(--color-primary)] border border-blue-100 bg-blue-50/50 rounded-lg hover:bg-blue-100/50 transition-all capitalize"
            >
              <MapPin size={14} />
              Pick location on map
            </button>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize block mb-2">Hiring opportunity</label>
            <div
              onClick={() => setHeaderData({ ...headerData, hire_status: !headerData.hire_status })}
              className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100/50 rounded-md cursor-pointer hover:bg-blue-50 transition-all transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${headerData.hire_status ? 'bg-green-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${headerData.hire_status ? 'left-[16px]' : 'left-[3px]'}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">In hiring mode</p>
                  <p className="text-xs text-gray-500">Show a "Hiring" badge on your profile</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 py-5 border-t border-gray-100 bg-white flex gap-3 justify-end z-[100002]">
          <button onClick={() => setEditing(false)} className="px-6 py-3 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors capitalize tracking-widest">
            Cancel
          </button>
          <button onClick={handleSave} className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-900/10 hover:brightness-110 transition-all capitalize tracking-widest">
            Save changes
          </button>
        </div>
      </Sheet>

      {showMap && (
        <MapPicker onLocationSelect={handleLocationSelect} onClose={() => setShowMap(false)} />
      )}
    </>
  );
}
