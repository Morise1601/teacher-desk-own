'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  DollarSign, 
  UploadCloud, 
  Rocket,
  ShieldCheck,
  Zap,
  Layout,
  FileText,
  MousePointer2,
  ImageIcon,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { createCourseAction } from '@/app/actions/courses';
import { encryptData, decryptData } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';
import { AnimatePresence } from 'framer-motion';
import ImageCropper from '@/components/ui/ImageCropper';

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'Beginner',
    price: '',
    status: 'Draft',
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Asset exceeds 5MB limit.");
      const reader = new FileReader();
      reader.onload = () => {
        setCroppingImage(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (blob: Blob) => {
    const file = new File([blob], "banner.jpg", { type: "image/jpeg" });
    setBannerFile(file);
    setPreviewUrl(URL.createObjectURL(blob));
    setIsCropperOpen(false);
    setCroppingImage(null);
    toast.success("Banner optimized & ready!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Course title is required.");

    try {
      setLoading(true);
      
      const payload = encryptData({
        ...formData,
        price: parseFloat(formData.price) || 0
      });

      const encryptedRes = await createCourseAction(payload);
      const res = decryptData(encryptedRes);

      if (!res.success || !res.course?.id) {
        throw new Error(res.message || "Failed to create record.");
      }

      const courseId = res.course.id;

      if (bannerFile) {
        const filePath = `${courseId}/banner_${Date.now()}.jpg`;
        
        const loadingToast = toast.loading("Uploading course banner...");
        
        const { error: uploadError } = await supabase.storage
          .from('courses')
          .upload(filePath, bannerFile);

        if (uploadError) {
          toast.dismiss(loadingToast);
          toast.error(`Upload failed: ${uploadError.message}`);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('courses')
            .getPublicUrl(filePath);
            
          const banner_url = publicUrlData.publicUrl;
          await supabase.from('courses').update({ banner_url }).eq('id', courseId);
          toast.dismiss(loadingToast);
        }
      }

      toast.success("Course successfully launched!");
      router.push('/dashboard/super-admin/courses');

    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const levels = [
    { name: 'Beginner', icon: <Zap size={16} className="stroke-[3px]" /> },
    { name: 'Intermediate', icon: <Layers size={16} className="stroke-[3px]" /> },
    { name: 'Advanced', icon: <ShieldCheck size={16} className="stroke-[3px]" /> }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 mt-6">
      
      {/* ── Page Header ── */}
      <div className="flex items-center gap-5 border-b border-slate-100 pb-8">
         <Link href="/dashboard/super-admin/courses">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 flex items-center justify-center rounded-md bg-white border border-slate-100 text-slate-400 hover:text-[var(--color-primary)] transition-all shadow-sm"
            >
              <ArrowLeft size={18} className="stroke-[3px]" />
            </motion.button>
         </Link>
         <div>
            <h1 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Course Architect</h1>
            <p className="text-xs text-slate-500 font-semibold mt-1">Configure and launch a new educational module.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Main Form Area ── */}
        <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white p-8 rounded-md border border-slate-100 shadow-sm space-y-6">
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                       <Layout size={14} className="text-indigo-400" />
                       Course Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masterclass in Modern Pedagogy"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full h-12 px-5 rounded-md border-2 border-slate-50 bg-slate-50/50 text-base font-bold text-slate-700 focus:border-indigo-100 focus:bg-white transition-all outline-none"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          <Zap size={14} className="text-amber-400" />
                          Difficulty Matrix
                       </label>
                       <div className="flex gap-2">
                          {levels.map((lvl) => (
                             <button
                                key={lvl.name}
                                type="button"
                                onClick={() => setFormData({ ...formData, level: lvl.name })}
                                className={`flex-1 p-2 rounded-md border-2 transition-all flex flex-col items-center gap-1 ${
                                  formData.level === lvl.name 
                                  ? 'border-indigo-500 bg-indigo-50/30' 
                                  : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-100'
                                }`}
                             >
                                <div className={`p-1.5 rounded transition-colors ${
                                  formData.level === lvl.name ? 'text-indigo-600' : 'text-slate-300'
                                }`}>
                                   {lvl.icon}
                                </div>
                                <span className="text-[10px] font-bold">{lvl.name}</span>
                             </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          <DollarSign size={14} className="text-emerald-400" />
                          Pricing (USD)
                       </label>
                       <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="w-full h-12 pl-12 pr-4 rounded-md border-2 border-slate-50 bg-slate-50/50 text-base font-bold text-slate-700 focus:border-indigo-100 focus:bg-white outline-none transition-all"
                          />
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">$</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                       <FileText size={14} />
                       Course Description
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Detail the curriculum and learning outcomes..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-5 rounded-md border-2 border-slate-50 bg-slate-50/50 text-sm font-bold text-slate-600 focus:border-indigo-100 focus:bg-white outline-none transition-all resize-none"
                    />
                 </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                 <Link href="/dashboard/super-admin/courses">
                    <button type="button" className="px-6 py-2.5 rounded-md text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                 </Link>
                 <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[var(--color-primary)] text-white rounded-md font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                 >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Rocket size={16} className="stroke-[3px]" />
                    )}
                    <span>Initialize Launch</span>
                 </button>
              </div>
            </form>
        </div>

        {/* ── Side Configuration Area ── */}
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-md border border-slate-100 shadow-sm space-y-6">
               <label className="text-xs font-bold text-slate-400 flex items-center gap-2">
                  <ImageIcon size={14} className="text-sky-400" />
                  Banner Asset
               </label>
               
               <div className={`relative group h-48 w-full rounded-md border-2 border-dashed transition-all overflow-hidden ${
                 bannerFile ? 'border-indigo-200' : 'border-slate-100 bg-slate-50/50 hover:border-slate-300'
               }`}>
                  {previewUrl ? (
                     <div className="absolute inset-0">
                        <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                           <span className="text-[10px] font-bold capitalize">Change Image</span>
                        </div>
                     </div>
                  ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2 cursor-pointer">
                        <UploadCloud size={24} className="text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Upload Banner</span>
                     </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
               </div>

               <div className="p-4 bg-slate-50/80 rounded-md border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-2 block">Visibility Mode</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="Draft">Save as Draft</option>
                    <option value="Published">Publish Live</option>
                  </select>
               </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-md text-white space-y-3 relative overflow-hidden group shadow-lg shadow-indigo-600/20">
               <Sparkles className="absolute -top-2 -right-2 opacity-20 rotate-12 transition-transform duration-700" size={60} />
               <h4 className="text-xs font-bold capitalize tracking-wider relative z-10">Architect's Note</h4>
               <p className="text-[11px] font-bold text-indigo-100 leading-relaxed relative z-10">
                  Flagship modules with creative banners and multi-level difficulty matrices see significantly higher institutional engagement.
               </p>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {isCropperOpen && croppingImage && (
          <ImageCropper
            image={croppingImage}
            aspectRatio={16/9}
            onCrop={handleCropComplete}
            onCancel={() => { setIsCropperOpen(false); setCroppingImage(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
