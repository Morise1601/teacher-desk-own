'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, TrendingUp, BarChart3, Download, Sparkles } from 'lucide-react';
import { getAdminDashboardStatsAction } from '@/app/actions/auth';
import { decryptData } from '@/lib/crypto';
import { toast } from 'react-toastify';

export default function SuperAdminDashboard() {
   const [stats, setStats] = useState({ teachers: 0, institutions: 0 });
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchStats = async () => {
         try {
            const encryptedResponse = await getAdminDashboardStatsAction();
            const response = decryptData(encryptedResponse);
            if (response && response.success) {
               setStats(response.data);
            }
         } catch (err) { 
            console.error("Fetch stats error:", err); 
         } finally { 
            setLoading(false); 
         }
      };
      fetchStats();
   }, []);

   const handleExport = () => {
      try {
         const csvContent = "data:text/csv;charset=utf-8," 
            + "Metric,Count\n"
            + `Total Registered Teachers,${stats.teachers}\n`
            + `Registered Institutions,${stats.institutions}\n`;
         
         const encodedUri = encodeURI(csvContent);
         const link = document.createElement("a");
         link.setAttribute("href", encodedUri);
         link.setAttribute("download", "teacherdesk_overview_stats.csv");
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         toast.success("Dashboard stats exported successfully!");
      } catch (err) {
         toast.error("Failed to export stats.");
      }
   };

   const handleAnalysis = () => {
      toast.info("Detailed global analytics module is under development!");
   };

   return (
      <div className="space-y-6 pb-6 flex flex-col pt-4 px-2">
         {/* Premium Header */}
         <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-md bg-[var(--color-primary)] p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
         >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/30 blur-3xl rounded-full translate-y-1/3 -translate-x-1/4" />
            
            <div className="relative z-10 space-y-2">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-1 shadow-inner">
                  <Sparkles size={12} className="text-amber-300" />
                  <span className="text-[10px] font-bold tracking-widest capitalize">Overview</span>
               </div>
               <h1 className="text-3xl md:text-4xl font-bold oswald-font tracking-tight capitalize leading-none drop-shadow-lg">
                  Super Admin <span className="text-indigo-300">Dashboard</span>
               </h1>
               <p className="text-xs md:text-sm text-gray-300 brcob-font max-w-xl font-light leading-relaxed">
                  Monitor and manage the core metrics of TeacherDesk globally. Track exact registration counts live.
               </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <button onClick={handleExport} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-white font-semibold text-xs transition-all backdrop-blur-md shadow-md hover:shadow-lg hover:-translate-y-0.5">
                   <Download size={14} />
                   <span>Export</span>
                </button>
                <button onClick={handleAnalysis} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-[var(--color-primary)] hover:bg-gray-50 rounded-md font-bold text-xs shadow-md shadow-white/10 transition-all hover:shadow-lg hover:-translate-y-0.5">
                   <BarChart3 size={14} />
                   <span>Analysis</span>
                </button>
            </div>
         </motion.div>

         {/* Premium Stats Blocks */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            {/* Teachers Block */}
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.1, duration: 0.4 }}
               className="group relative overflow-hidden bg-white rounded-md p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(30,58,138,0.1)] transition-all duration-500 flex flex-col justify-between"
            >
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100/80 transition-colors duration-700" />
               <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-50/50 rounded-full blur-2xl group-hover:bg-blue-100/50 transition-colors duration-700" />
               
               <div className="relative z-10 flex items-start justify-between">
                  <div>
                     <div className="w-12 h-12 rounded-md bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-inner border border-indigo-100/50">
                        <Users size={20} className="text-indigo-600" />
                     </div>
                     <h3 className="text-sm font-semibold text-gray-500 capitalize tracking-tight brcob-font">Total Registered Teachers</h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100/50 shadow-sm">
                     <TrendingUp size={12} className="text-emerald-600" />
                     <span className="text-xs font-bold text-emerald-600">+12%</span>
                  </div>
               </div>

               <div className="relative z-10 mt-2">
                  <span className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] oswald-font tracking-tighter drop-shadow-sm">
                     {loading ? '...' : stats.teachers.toLocaleString()}
                  </span>
               </div>
               
               <div className="relative z-10 mt-6 pt-5 border-t border-gray-50">
                  <p className="text-xs text-gray-400 brcob-font leading-relaxed font-medium">
                     Active educators empowering classrooms worldwide with specialized tools.
                  </p>
               </div>
            </motion.div>

            {/* Institutions Block */}
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2, duration: 0.4 }}
               className="group relative overflow-hidden bg-white rounded-md p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.1)] transition-all duration-500 flex flex-col justify-between"
            >
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100/80 transition-colors duration-700" />
               <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-50/50 rounded-full blur-2xl group-hover:bg-teal-100/50 transition-colors duration-700" />
               
               <div className="relative z-10 flex items-start justify-between">
                  <div>
                     <div className="w-12 h-12 rounded-md bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500 shadow-inner border border-emerald-100/50">
                        <Building2 size={20} className="text-emerald-600" />
                     </div>
                     <h3 className="text-sm font-semibold text-gray-500 capitalize tracking-tight brcob-font">Registered Institutions</h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100/50 shadow-sm">
                     <TrendingUp size={12} className="text-emerald-600" />
                     <span className="text-xs font-bold text-emerald-600">+5%</span>
                  </div>
               </div>

               <div className="relative z-10 mt-2">
                  <span className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] oswald-font tracking-tighter drop-shadow-sm">
                     {loading ? '...' : stats.institutions.toLocaleString()}
                  </span>
               </div>
               
               <div className="relative z-10 mt-6 pt-5 border-t border-gray-50">
                  <p className="text-xs text-gray-400 brcob-font leading-relaxed font-medium">
                     Universities and schools driving academic excellence globally with modern analytics.
                  </p>
               </div>
            </motion.div>
         </div>
      </div>
   );
}
