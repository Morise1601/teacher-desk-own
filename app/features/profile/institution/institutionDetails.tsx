'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Phone, Mail, FileText } from 'lucide-react';

interface InstitutionDetailsProps {
  institution: any;
}

export default function InstitutionDetails({ institution }: InstitutionDetailsProps) {
  const details = [
    { icon: <MapPin size={14} />, label: "Address", value: institution.address || "Not set", color: "text-blue-500" },
    { icon: <Mail size={14} />, label: "Official Email", value: institution.email || "Not set", color: "text-red-500" },
    { icon: <Phone size={14} />, label: "Contact Phone", value: institution.phone || "Not set", color: "text-green-500" },
    { icon: <Globe size={14} />, label: "Website", value: institution.website || "Not set", isLink: true, color: "text-indigo-500" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-md p-6 border border-gray-100 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-50 rounded-md text-purple-600">
          <FileText size={16} />
        </div>
        <h3 className="text-sm font-bold text-[#0d163a] capitalize tracking-wider oswald-font">Contact Information</h3>
      </div>

      <div className="space-y-4">
        {details.map((item, index) => (
          <div key={index} className="flex flex-col gap-1.5 p-3 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
            <div className="flex items-center gap-2 text-[10px] capitalize font-bold text-gray-400 tracking-tight oswald-font">
              <span className={item.color}>{item.icon}</span>
              {item.label}
            </div>
            {item.isLink && item.value !== "Not set" ? (
              <a 
                href={item.value.startsWith('http') ? item.value : `https://${item.value}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[12px] font-semibold text-[var(--color-primary)] hover:underline truncate oswald-font"
              >
                {item.value}
              </a>
            ) : (
              <span className={`text-[12px] font-semibold text-gray-700 truncate oswald-font ${item.value === "Not set" ? 'italic text-gray-300' : ''}`}>
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
