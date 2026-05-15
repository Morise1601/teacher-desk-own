'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Zap,
  Mail,
  MapPin,
  ChevronRight,
  Download,
  Calendar,
  Phone,
  Globe,
  Users
} from 'lucide-react';
import { getInstitutionsListAction } from '@/app/actions/institution';
import { decryptData } from '@/lib/crypto';
import { toast } from 'react-toastify';
import { Sheet } from '@/components/ui/sheet';
import { UserAvatar } from '@/components/ui/user-avatar';

// Institutional Row Component
const InstitutionalRow = ({ org, idx, onView }: { org: any, idx: number, onView: (o: any) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * idx }}
      className="group bg-white border border-gray-100 p-4 rounded-md shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col md:flex-row md:items-center gap-4 md:gap-6"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <UserAvatar 
          src={org.logo_url} 
          name={org.name || org.full_name}
          className="w-12 h-12 bg-emerald-50 text-emerald-500 border-emerald-100/50 group-hover:border-[var(--color-primary)]"
          fallbackClassName="text-lg text-emerald-600"
          size={20}
        />

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="flex flex-col truncate">
            <h3 className="text-base font-semibold text-[var(--color-primary)] truncate capitalize">
              {org.name || org.full_name || 'Unknown Institution'}
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Verified Institution</p>
          </div>
          <div className="hidden sm:flex flex-col truncate">
            <span className="text-sm text-gray-500 font-medium truncate flex items-center gap-2">
              <Mail size={14} className="text-gray-400" /> {org.email}
            </span>
          </div>
          <div className="hidden lg:flex flex-col truncate">
            <span className="text-sm text-gray-500 font-medium truncate flex items-center gap-2 capitalize">
              <MapPin size={14} className="text-gray-400" /> {org.address || org.location || 'Location Hidden'}
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
           title="Message Institution"
        >
          <Mail size={16} />
        </button>
        <button 
           onClick={() => onView(org)}
           className="h-10 px-5 bg-white border border-gray-200 rounded-md text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:shadow-md transition-all flex items-center gap-2"
        >
          <span>View Profile</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default function InstitutionsListPage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sheet state
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const encryptedResponse = await getInstitutionsListAction();
        const response = decryptData(encryptedResponse);
        if (response && response.success) {
          setInstitutions(response.data || []);
        } else {
          toast.error("Failed to load institutions list.");
        }
      } catch (err) {
        toast.error("Network error fetching institutions.");
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutions();
  }, []);

  const filteredInstitutions = institutions.filter(inst =>
    (inst.name || inst.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inst.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Widget */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-md shadow-sm border border-gray-100">
        <div>
           <h1 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize">Institution Directory</h1>
           <p className="text-sm text-gray-500 font-medium mt-1">Manage and view all registered schools and academic groups globally.</p>
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
             <button onClick={() => toast.info("Add functionality coming soon")} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-md font-semibold text-sm shadow-md hover:shadow-lg transition-all active:scale-95">
               <Plus size={16} />
               <span>Add Institution</span>
             </button>
          </div>
        </div>
      </div>

      {/* Main Listing View */}
      <div className="space-y-4">
        <AnimatePresence>
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white rounded-md border border-gray-100 shadow-sm min-h-[400px]">
              <div className="w-12 h-12 border-4 border-emerald-100 border-t-[var(--color-primary)] rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Loading institutions...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInstitutions.length > 0 ? filteredInstitutions.map((org, idx) => (
                <InstitutionalRow key={org.id || idx} org={org} idx={idx} onView={setSelectedInstitution} />
              )) : (
                <div className="py-24 flex flex-col items-center text-center bg-white rounded-md border border-gray-100 shadow-sm">
                   <Building2 size={48} className="text-gray-300 mb-4" />
                   <h3 className="text-lg font-semibold text-gray-600">No institutions found</h3>
                   <p className="text-sm text-gray-400 mt-1">Try adjusting your search query.</p>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Complete Profile Panel (Sheet) */}
      <Sheet 
         open={!!selectedInstitution} 
         onClose={() => setSelectedInstitution(null)}
         width="max-w-xl"
      >
         {selectedInstitution && (
           <div className="flex flex-col h-full bg-white">
              {/* Header Profile Hero */}
              <div className="flex flex-col items-center p-8 bg-gradient-to-br from-emerald-50 to-white border-b border-gray-100 relative rounded-md m-2 shadow-sm">
                 <UserAvatar 
                    src={selectedInstitution.logo_url} 
                    name={selectedInstitution.name || selectedInstitution.full_name}
                    className="w-24 h-24 border-4 border-white shadow-lg bg-emerald-50 text-emerald-500"
                    fallbackClassName="text-4xl text-emerald-600"
                    size={40}
                 />
                 <h2 className="text-2xl font-bold text-[var(--color-primary)] oswald-font tracking-tight capitalize text-center">{selectedInstitution.name || selectedInstitution.full_name || 'Unknown Institution'}</h2>
                 <p className="text-sm text-gray-500 font-medium mb-4">{selectedInstitution.type || 'Educational Institution'}</p>
                 <div className="flex gap-3">
                    <button 
                       onClick={() => toast.info("Messaging module under construction!")}
                       className="px-6 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-md shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                       <Mail size={16} /> Contact
                    </button>
                    <a 
                       href={`mailto:${selectedInstitution.email}`}
                       className="px-6 py-2 bg-white border border-gray-200 text-[var(--color-primary)] text-sm font-semibold rounded-md shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                       <Globe size={16} /> Website
                    </a>
                 </div>
              </div>

              {/* Advanced Details */}
              <div className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar">
                 {/* Contact Details Grid */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-400 tracking-wider capitalize mb-4 border-b border-gray-100 pb-2">Core Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                          <Mail size={16} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                             <p className="text-xs font-semibold text-gray-400">Official Email</p>
                             <p className="text-sm font-medium text-gray-800 break-words">{selectedInstitution.email || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                          <Phone size={16} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                             <p className="text-xs font-semibold text-gray-400">Phone</p>
                             <p className="text-sm font-medium text-gray-800">{selectedInstitution.phone_number || selectedInstitution.phone || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-md sm:col-span-2">
                          <MapPin size={16} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                             <p className="text-xs font-semibold text-gray-400">Registered Address</p>
                             <p className="text-sm font-medium text-gray-800 capitalize leading-snug">{selectedInstitution.address || selectedInstitution.location || 'N/A'}</p>
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Administrative Details Section */}
                 <section>
                    <h3 className="text-sm font-bold text-gray-400 tracking-wider capitalize mb-4 border-b border-gray-100 pb-2">Administrative Info</h3>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-md">
                          <Users size={18} className="text-indigo-500 mt-1 flex-shrink-0" />
                          <div>
                             <p className="text-sm font-bold text-gray-800 mb-1">Administrative Contact</p>
                             <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                {selectedInstitution.contact_person || 'No main contact officially listed.'}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-md">
                          <Zap size={18} className="text-amber-500 mt-1 flex-shrink-0" />
                          <div>
                             <p className="text-sm font-bold text-gray-800 mb-1">Institution Capabilities</p>
                             <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                Verified TeacherDesk Platform Integrator. Full access to management, reporting, and global directory services.
                             </p>
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* Account Status Segment */}
                 <section className="pb-8">
                    <h3 className="text-sm font-bold text-gray-400 tracking-wider capitalize mb-4 border-b border-gray-100 pb-2">Network Status</h3>
                    <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-md border border-emerald-100/50">
                       <div className="w-10 h-10 bg-emerald-100 rounded-md flex items-center justify-center">
                          <Calendar size={18} className="text-emerald-600" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-emerald-800">Verified Institution</p>
                          <p className="text-xs font-medium text-emerald-600">
                             Registered on {selectedInstitution.created_at ? new Date(selectedInstitution.created_at).toLocaleDateString() : 'N/A'}
                          </p>
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
