'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Pencil, MapPin, Briefcase, LogOut, User, Share2, ShieldCheck } from 'lucide-react';
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

interface ProfileHeaderProps {
  profile: any;
  onUpdate: (data: any) => void;
  isEditing: boolean;
  setEditing: (val: boolean) => void;
}

export default function ProfileHeader({ profile, onUpdate, isEditing, setEditing }: ProfileHeaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [headerData, setHeaderData] = useState({
    headline: profile.headline || '',
    location: profile.location || '',
    work_status: profile.work_status ?? true, // true means NOT open to work (hired)
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
      const payload = { userId: profile.user_id, base64Image: reader.result as string, fileName: file.name };
      const res = decryptData(await uploadProfilePicAction(encryptData(payload)));
      if (res?.success) {
        toast.success("Avatar updated!");
        onUpdate({ ...profile, profile_pic_url: res.profilePicUrl });
      } else { toast.error("Upload failed."); }
      setUploading(false);
    };
  };

  const handleLocationSelect = (address: string) => {
    setHeaderData(prev => ({ ...prev, location: address }));
    setShowMap(false);
  };

  const handleSave = () => {
    onUpdate({
      ...profile,
      headline: headerData.headline,
      location: headerData.location,
      work_status: headerData.work_status
    });
    setEditing(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        /* ⚠️ NO overflow-hidden here — avatar must not be clipped */
        className="bg-white rounded-md shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100 relative"
      >
        {/* ── BANNER ─────────────────────── */}
        {/* overflow-hidden only on the banner itself */}
        <div className="h-28 sm:h-36 md:h-44 bg-gradient-to-br from-[#0d163a] to-[var(--color-primary)] relative overflow-hidden rounded-t-md">
          <motion.div
            animate={{ x: [0, 40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[-60%] left-[-20%] w-[140%] h-[200%] opacity-10 bg-[radial-gradient(circle_at_center,_var(--color-primary)_0%,_transparent_60%)]"
          />
          <div className="absolute top-3 right-4 flex items-center gap-1.5 text-white/25 text-xs font-medium select-none">
            <ShieldCheck size={9} />
            <span className="capitalize hidden sm:inline">Identity secured</span>
          </div>
        </div>

        {/* ── AVATAR — positioned absolute over the banner/card boundary ── */}
        <div className="absolute left-4 sm:left-6 top-[calc(7rem-2.5rem)] sm:top-[calc(9rem-3rem)] md:top-[calc(11rem-3.5rem)] z-20">
          {/* glow ring */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-br from-[var(--color-primary)]/25 to-[var(--color-secondary)]/10 blur-md" />
          {/* white border circle */}
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-xl bg-white">
            <div className="w-full h-full rounded-full overflow-hidden group/avatar relative bg-gray-50">
              <UserAvatar
                src={profile.profile_pic_url}
                name={profile.fullName || "Member"}
                className={`w-full h-full rounded-full transition-all duration-500 ${uploading ? 'blur-sm opacity-40' : 'opacity-100'}`}
                fallbackClassName="text-4xl"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <button
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-all flex flex-col items-center justify-center text-white rounded-full cursor-pointer z-40"
              >
                <Camera size={14} className="mb-0.5" />
                <span className="text-xs font-semibold capitalize">Update</span>
              </button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {/* ── INFO SECTION — padded top so it clears the avatar ── */}
        {/* 
            Avatar heights: mobile=80px, sm=112px, md=128px
            Banner heights: mobile=112px, sm=144px, md=176px
            Avatar's bottom edge = banner_height + (avatar_height/2)
            So padding-top should be at least avatar_height/2 + some breathing room
        */}
        <div className="pt-12 sm:pt-16 md:pt-18 pb-5 px-4 sm:px-6">
          {/* Row: Name + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {/* Left: Name block — offset right to not overlap avatar */}
            <div className="mt-4 min-w-0 space-y-1.5">
              {/* Name + role badge */}
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight capitalize leading-tight text-[#0d163a]">
                  {profile.fullName || "Member"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 text-[var(--color-primary)] text-xs font-bold rounded-md capitalize shadow-sm flex-shrink-0">
                  <User size={8} />
                  {profile.role || "Member"}
                </span>
                {profile.work_status === false && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-100 text-green-700 text-xs font-bold rounded-md shadow-sm flex-shrink-0"
                  >
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    #OpenToWork
                  </motion.div>
                )}
              </div>
              {/* Accent underline */}
              <div className="h-0.5 w-20 rounded-full bg-gradient-to-r from-[var(--color-primary)]/50 to-transparent" />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:mt-0 mt-2 pl-24 sm:pl-0">
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

          {/* Headline & Meta — full width, no avatar offset needed below name row */}
          <div className="mt-3 space-y-2">
            <p className="text-[13px] font-medium text-gray-500 leading-snug max-w-2xl">
              {profile.headline || "Click 'Edit Profile' to add a headline."}
            </p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-gray-400">
              <div className="flex items-center gap-1.5">
                <MapPin size={10} className="text-gray-300 flex-shrink-0" />
                <span className="text-xs font-medium capitalize">{profile.location || "Global base"}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-200 hidden sm:block" />
              <div className="text-xs font-medium">
                <span className="font-bold text-gray-700">500+</span>
                <span className="ml-1">connections</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Edit Sheet ──────────────────────────────────── */}
      <Sheet open={isEditing} onClose={() => setEditing(false)} title="Edit Identity" description="Headline & Location">
        <div className="space-y-5 pb-20">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Headline</label>
            <div className="relative">
              <Briefcase className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
              <Input
                value={headerData.headline}
                onChange={e => setHeaderData({ ...headerData, headline: e.target.value })}
                className="rounded-md border-gray-200 pl-8 h-9 text-xs font-medium bg-white text-gray-800"
                placeholder="e.g. Senior Research Fellow"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize">Location</label>
            <div className="flex items-start gap-2 p-3 bg-gray-50/30 border border-gray-100 rounded-md min-h-[50px]">
              <MapPin size={12} className={`mt-0.5 flex-shrink-0 ${headerData.location ? 'text-[var(--color-primary)]' : 'text-gray-300'}`} />
              <p className={`text-xs font-medium leading-relaxed ${headerData.location ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                {headerData.location || "No location set — use the map to pick one"}
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
            <label className="text-xs font-semibold text-gray-400 tracking-tight ml-0.5 capitalize block mb-2">Work opportunity</label>
            <div
              onClick={() => setHeaderData({ ...headerData, work_status: !headerData.work_status })}
              className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100/50 rounded-md cursor-pointer hover:bg-blue-50 transition-all transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-4 rounded-full relative transition-colors ${!headerData.work_status ? 'bg-[#0a66c2]' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${!headerData.work_status ? 'left-[16px]' : 'left-[3px]'}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Open to new opportunities</p>
                  <p className="text-xs text-gray-500">Show a badge on your profile to recruiters</p>
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
