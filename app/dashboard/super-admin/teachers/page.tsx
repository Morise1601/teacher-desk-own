'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  User,
  Mail,
  MessageSquare,
  Filter,
  Download,
  MapPin,
  ChevronRight,
  Phone,
  Calendar,
  BookOpen,
  Briefcase,
  Users
} from 'lucide-react';
import { getTeachersListAction } from '@/app/actions/teacher';
import { decryptData } from '@/lib/crypto';
import { toast } from 'react-toastify';
import { Sheet } from '@/components/ui/sheet';
import { UserAvatar } from '@/components/ui/user-avatar';

// Teacher Row Component
const TeacherRow = ({ teacher, idx, onView }: { teacher: any, idx: number, onView: (t: any) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * idx }}
      className="group bg-white border border-gray-100 p-4 rounded-md shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <UserAvatar 
          src={teacher.profile_picture} 
          name={teacher.full_name || teacher.name}
          className="w-12 h-12 group-hover:border-[var(--color-primary)]"
          fallbackClassName="text-lg"
        />

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="flex flex-col truncate">
            <h3 className="text-base font-semibold text-[var(--color-primary)] truncate capitalize">
              {teacher.full_name || teacher.name || 'Unknown Teacher'}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Verified Teacher</p>
          </div>
          <div className="hidden sm:flex flex-col truncate">
            <span className="text-sm text-gray-500 font-medium truncate flex items-center gap-2">
              <Mail size={14} className="text-gray-400" /> {teacher.email}
            </span>
          </div>
          <div className="hidden lg:flex flex-col truncate">
            <span className="text-sm text-gray-500 font-medium truncate flex items-center gap-2 capitalize">
              <MapPin size={14} className="text-gray-400" /> {teacher.address || 'Location Hidden'}
            </span>
          </div>
          <div className="hidden lg:flex items-center justify-start">
            <div className="px-3 py-1 bg-emerald-50 text-xs font-semibold text-emerald-600 rounded-md border border-emerald-100/50 transition-colors tracking-wide">
              Active
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 md:pt-0 border-t border-gray-50 md:border-none w-full md:w-auto justify-end">
        <button 
           onClick={() => toast.info("Messaging module is under construction!")}
           className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-50 text-gray-500 hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-sm tooltip"
           title="Message Teacher"
        >
          <MessageSquare size={16} />
        </button>
        <button 
           onClick={() => onView(teacher)}
           className="h-10 px-5 bg-white border border-gray-200 rounded-md text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-md transition-all flex items-center gap-2"
        >
          <span>View Profile</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default function TeachersListPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sheet state
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const encryptedResponse = await getTeachersListAction();
        const response = decryptData(encryptedResponse);
        if (response && response.success) {
          setTeachers(response.data || []);
        } else {
          toast.error("Failed to load teachers list.");
        }
      } catch (err) {
        toast.error("Network error fetching teachers.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(t =>
    (t.full_name || t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Widget */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-md shadow-sm border border-gray-100">
        <div>
           <h1 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Teacher Directory</h1>
           <p className="text-sm text-gray-500 font-medium mt-1">Manage and view all registered educator profiles globally.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64">
             <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
             <input
               type="text"
               placeholder="Search by name or email..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-gray-50 border border-gray-200 rounded-md py-2.5 pl-10 pr-4 text-sm font-medium w-full focus:bg-white focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
               autoComplete="off"
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button className="flex-1 sm:flex-none p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-500 hover:text-[var(--color-primary)] hover:bg-white transition-all shadow-sm flex items-center justify-center">
               <Filter size={18} />
             </button>
             <button onClick={() => toast.success("Exporting teacher list...")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-md font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95">
               <Download size={16} />
               <span>Export</span>
             </button>
          </div>
        </div>
      </div>

      {/* Main Listing View */}
      <div className="space-y-4">
        <AnimatePresence>
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white rounded-md border border-gray-100 shadow-sm min-h-[400px]">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-[var(--color-primary)] rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Loading educators...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeachers.length > 0 ? filteredTeachers.map((teacher, idx) => (
                <TeacherRow key={teacher.id || idx} teacher={teacher} idx={idx} onView={setSelectedTeacher} />
              )) : (
                <div className="py-24 flex flex-col items-center text-center bg-white rounded-md border border-gray-100 shadow-sm">
                   <Users size={48} className="text-gray-300 mb-4" />
                   <h3 className="text-lg font-semibold text-gray-600">No teachers found</h3>
                   <p className="text-sm text-gray-400 mt-1">Try adjusting your search query.</p>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Complete Profile Panel (Sheet) */}
      <Sheet 
         open={!!selectedTeacher} 
         onClose={() => setSelectedTeacher(null)}
         width="max-w-xl"
      >
         {selectedTeacher && (
           <div className="flex flex-col h-full bg-white">
              {/* Header Profile Hero */}
              <div className="flex flex-col items-center p-8 bg-gradient-to-br from-indigo-50 to-white border-b border-gray-100 relative rounded-md m-2 shadow-sm">
                 <UserAvatar 
                    src={selectedTeacher.profile_picture} 
                    name={selectedTeacher.full_name || selectedTeacher.name}
                    className="w-24 h-24 border-4 border-white shadow-lg"
                    fallbackClassName="text-4xl"
                 />
                 <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">{selectedTeacher.full_name || selectedTeacher.name || 'Unknown User'}</h2>
                 <p className="text-sm text-gray-500 font-medium mb-4">{selectedTeacher.designation || 'Teacher / Educator'}</p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => toast.info("Messaging functionality is under construction!")}
                       className="px-6 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-md shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                       <MessageSquare size={16} /> Message
                    </button>
                    <a 
                       href={`mailto:${selectedTeacher.email}`}
                       className="px-6 py-2 bg-white border border-gray-200 text-[var(--color-primary)] text-sm font-semibold rounded-md shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                       <Mail size={16} /> Email
                    </a>
                 </div>
              </div>

              {/* Advanced Details */}
              <div className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
                 {/* Contact Details Grid */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-400 tracking-wider capitalize mb-4 border-b border-gray-100 pb-2">Contact Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                          <Mail size={16} className="text-[var(--color-primary)] mt-0.5" />
                          <div className="min-w-0">
                             <p className="text-xs font-semibold text-gray-400">Email Address</p>
                             <p className="text-sm font-medium text-gray-800 truncate">{selectedTeacher.email || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                          <Phone size={16} className="text-[var(--color-primary)] mt-0.5" />
                          <div>
                             <p className="text-xs font-semibold text-gray-400">Phone</p>
                             <p className="text-sm font-medium text-gray-800">{selectedTeacher.phone_number || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md sm:col-span-2">
                          <MapPin size={16} className="text-[var(--color-primary)] mt-0.5" />
                          <div>
                             <p className="text-xs font-semibold text-gray-400">Location</p>
                             <p className="text-sm font-medium text-gray-800 capitalize">{selectedTeacher.address || 'N/A'}</p>
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Professional Details Section */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-400 tracking-wider capitalize mb-4 border-b border-gray-100 pb-2">Professional Info</h3>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-md">
                          <BookOpen size={18} className="text-indigo-500 mt-1 flex-shrink-0" />
                          <div>
                             <p className="text-sm font-bold text-gray-800 mb-1">Subjects & Expertise</p>
                             <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                {selectedTeacher.subject_expertise || 'No specialty formally listed on platform.'}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-md">
                          <Briefcase size={18} className="text-emerald-500 mt-1 flex-shrink-0" />
                          <div>
                             <p className="text-sm font-bold text-gray-800 mb-1">Current Affiliation / Background</p>
                             <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                {selectedTeacher.work_experience || 'No extended institutional background listed.'}
                             </p>
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Account Status Segment */}
                 <section className="pb-8">
                    <h3 className="text-sm font-bold text-gray-400 tracking-wider capitalize mb-4 border-b border-gray-100 pb-2">Account Status</h3>
                    <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-md border border-emerald-100/50">
                       <div className="w-10 h-10 bg-emerald-100 rounded-md flex items-center justify-center">
                          <Calendar size={18} className="text-emerald-600" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-emerald-800">Verified Member</p>
                          <p className="text-xs font-medium text-emerald-600">Joined Platform Active Data Sync</p>
                       </div>
                    </div>
                 </section>
              </div>
           </div>
         )}
      </Sheet>
    </div>
  );
}
