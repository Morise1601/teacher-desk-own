'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  DollarSign,
  BarChart3,
  CheckCircle,
  FileCode2,
  Bookmark,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  UploadCloud,
  FileText,
  Layout,
  Save,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCoursesListAction, deleteCourseAction, updateCourseAction } from '@/app/actions/courses';
import { decryptData, encryptData } from '@/lib/crypto';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { Sheet, SheetFooter } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import ImageCropper from '@/components/ui/ImageCropper';

export default function CoursesListPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  // Edit Sheet State
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const encryptedResponse = await getCoursesListAction();
      const response = decryptData(encryptedResponse);
      if (response && response.success) {
        setCourses(response.data || []);
      } else {
        toast.error("Failed to load course directory.");
      }
    } catch (err: any) {
      toast.error("Network synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    const isConfirmed = window.confirm(`Permanently delete "${title}"? This architectural purge cannot be undone.`);
    if (!isConfirmed) return;

    try {
      const payload = encryptData({ id });
      const encryptedRes = await deleteCourseAction(payload);
      const res = decryptData(encryptedRes);
      if (res && res.success) {
        toast.success("Module successfully deconstructed.");
        fetchCourses();
      } else {
        toast.error(res?.message || "Purge execution failed.");
      }
    } catch (error) {
      toast.error("Process error during deletion.");
    }
  };

  const handleEditClick = (course: any) => {
    setSelectedCourse(course);
    setEditFormData({ ...course });
    setNewBannerFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit.");
        return;
      }
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
    setNewBannerFile(file);
    setIsCropperOpen(false);
    setCroppingImage(null);
    toast.success("Banner optimized & ready!");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title) return toast.error("Course title is required.");

    try {
      setIsUpdating(true);
      let banner_url = editFormData.banner_url;

      if (newBannerFile) {
        // Use a timestamp to prevent browser caching of the URL
        const filePath = `${selectedCourse.id}/banner_${Date.now()}.jpg`;
        
        // Optional: Clean up old files in this course folder first
        const { data: oldFiles } = await supabase.storage.from('courses').list(selectedCourse.id);
        if (oldFiles && oldFiles.length > 0) {
          const filesToRemove = oldFiles.map((f) => `${selectedCourse.id}/${f.name}`);
          await supabase.storage.from('courses').remove(filesToRemove);
        }

        const { error: uploadError } = await supabase.storage
          .from('courses')
          .upload(filePath, newBannerFile);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('courses').getPublicUrl(filePath);
          banner_url = publicUrlData.publicUrl;
        } else {
          console.error("❌ [STORAGE UPLOAD ERROR]:", uploadError);
          toast.error("Failed to upload assets.");
          setIsUpdating(false);
          return;
        }
      }

      const payload = encryptData({ 
        ...editFormData, 
        banner_url, 
        price: parseFloat(editFormData.price) || 0 
      });
      const encryptedRes = await updateCourseAction(payload);
      const res = decryptData(encryptedRes);

      if (res && res.success) {
        toast.success("Entity schemas optimized.");
        setSelectedCourse(null);
        fetchCourses();
      } else {
        toast.error(res?.message || "Sync failed.");
      }
    } catch (error: any) {
      toast.error(error.message || "Expansion error.");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const searchMatch = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      const tabMatch = activeTab === 'All' || c.status === activeTab;
      return searchMatch && tabMatch;
    });
  }, [courses, searchTerm, activeTab]);

  const stats = useMemo(() => ({
    total: courses.length,
    published: courses.filter(c => c.status === 'Published').length,
    drafts: courses.filter(c => c.status === 'Draft').length
  }), [courses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 mt-4">

      {/* ── Page Header / Matching Teacher Style ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-md shadow-sm border border-gray-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center text-[var(--color-primary)]">
              <BookOpen size={20} className="stroke-[2.5px]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Course Directory</h1>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1 capitalize">Manage and oversee all educational modules within the ecosystem.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-md py-2.5 pl-10 pr-4 text-sm font-medium w-full focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-500 hover:text-[var(--color-primary)] hover:bg-white transition-all shadow-sm flex items-center justify-center">
              <Filter size={18} />
            </button>
            <Link href="/dashboard/super-admin/courses/create" className="flex-1 sm:flex-none">
              <button className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-md font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95">
                <Plus size={16} className="stroke-[3.5px]" />
                <span>Create Course</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Status Pivot Controls ── */}
      <div className="inline-flex items-center p-1 bg-white border border-gray-100 rounded-md shadow-sm">
        {['All', 'Published', 'Draft'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2 rounded-md text-[13px] font-bold transition-all relative ${activeTab === tab
              ? 'text-[var(--color-primary)] bg-indigo-50/50 border border-indigo-100/50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
          >
            <span className="relative z-10 capitalize">{tab}</span>
          </button>
        ))}
      </div>

      {/* ── Sleek Module Data Table / Cards ── */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white rounded-md border border-gray-100 shadow-sm min-h-[400px]">
              <Loader2 className="w-12 h-12 border-4 border-indigo-100 border-t-[var(--color-primary)] rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Syncing database...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-white rounded-md border border-gray-100 shadow-sm">
              <BookOpen size={48} className="text-gray-200 mb-6" />
              <h3 className="text-lg font-bold text-gray-600 capitalize">Empty repository detected</h3>
              <p className="text-sm text-gray-400 mt-1 mb-8">Kickstart your institution with the first module launch.</p>
              <Link href="/dashboard/super-admin/courses/create">
                <button className="px-8 py-2 bg-white border border-gray-200 rounded-md text-sm font-bold text-[var(--color-primary)] hover:border-[var(--color-primary)] shadow-sm transition-all capitalize">
                  Initiate Creation
                </button>
              </Link>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, idx) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="group bg-white rounded-md border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                  <div className="h-44 relative overflow-hidden bg-gray-50 border-b border-gray-50">
                    {course.banner_url ? (
                      <img src={course.banner_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200"><Bookmark size={50} className="opacity-10" /></div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-4 py-1.5 rounded-md text-[10px] font-bold tracking-tight shadow-lg capitalize border ${course.status === 'Published' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/90 text-gray-500 border-gray-200 backdrop-blur-sm'}`}>
                        {course.status}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/95 rounded-md shadow-md border border-gray-50 flex items-center gap-1.5">
                      <DollarSign size={13} className="text-emerald-500 stroke-[3px]" />
                      <span className="text-sm font-bold text-gray-800 tabular-nums">{Number(course.price) === 0 ? 'Free' : Number(course.price).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-md border ${course.level === 'Advanced' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>{course.level}</span>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 capitalize"><Calendar size={11} className="stroke-[2.5px]" /> {new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-primary)] leading-snug line-clamp-2 h-[44px] capitalize group-hover:text-indigo-600 transition-colors mb-3">{course.title}</h3>
                    <p className="text-xs font-medium text-gray-500 line-clamp-2 leading-relaxed mb-6 italic min-h-[32px]">{course.description || 'Module details optimized for ecosystem synchronization.'}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditClick(course)} className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-50 text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-transparent hover:border-indigo-100 transition-all focus:ring-2 focus:ring-indigo-100" title="Edit Configuration"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(course.id, course.title)} className="w-10 h-10 flex items-center justify-center rounded-md bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm focus:ring-2 focus:ring-rose-100" title="Purge Record"><Trash2 size={16} /></button>
                      </div>
                      <button className="h-10 px-5 bg-white border border-gray-200 rounded-md text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-sm transition-all flex items-center gap-2 group/btn capitalize">
                        <span>View Detail</span>
                        <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Edit Configuration Panel (Sheet) ── */}
      <Sheet open={!!selectedCourse} onClose={() => setSelectedCourse(null)} title="Optimize Course Module" description="Recalibrate architectural schemas and assets." width="max-w-xl">
        {selectedCourse && (
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-bold text-gray-400 capitalize mb-1.5 block">Module Title</label>
                <input type="text" required value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full h-12 px-4 bg-gray-50 rounded-md border-2 border-gray-50 text-sm font-bold text-gray-800 focus:bg-white focus:border-indigo-100 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 capitalize mb-1.5 block">Pricing (USD)</label>
                  <input type="number" step="0.01" value={editFormData.price} onChange={e => setEditFormData({ ...editFormData, price: e.target.value })} className="w-full h-12 px-4 bg-gray-50 rounded-md border-2 border-gray-50 text-sm font-bold text-gray-800 outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-400 capitalize mb-1.5 block">Difficulty Level</label>
                  <select value={editFormData.level} onChange={e => setEditFormData({ ...editFormData, level: e.target.value })} className="w-full h-12 px-4 bg-gray-50 rounded-md border-2 border-gray-50 text-sm font-bold text-gray-800 cursor-pointer">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 capitalize mb-1.5 block">Module Description</label>
                <textarea rows={6} value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} className="w-full p-4 bg-gray-50 rounded-md border-2 border-gray-50 text-sm font-medium text-gray-600 focus:bg-white outline-none resize-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 capitalize mb-1.5 block">Visual Identity</label>
                <div className="relative h-40 group rounded-md border-2 border-dashed border-gray-100 bg-gray-50 overflow-hidden flex flex-col items-center justify-center cursor-pointer">
                  <img src={newBannerFile ? URL.createObjectURL(newBannerFile) : editFormData.banner_url || '/placeholder.png'} className="w-full h-full object-cover absolute opacity-30" alt="" />
                  <UploadCloud size={24} className="text-gray-300 mb-2 relative z-10" />
                  <span className="text-[10px] font-bold text-gray-400 relative z-10 capitalize">Replace module banner asset</span>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                </div>
              </div>
            </div>
            <SheetFooter>
              <button type="button" onClick={() => setSelectedCourse(null)} className="px-6 py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors">Discard</button>
              <button type="submit" disabled={isUpdating} className="flex items-center gap-2 px-8 py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-md shadow-md focus:ring-4 focus:ring-[var(--color-primary)]/20 active:scale-95 transition-all">
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Update Data</span>
              </button>
            </SheetFooter>
          </form>
        )}
      </Sheet>

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
