"use client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { motion } from "framer-motion";
import { Check, X, Clock } from "lucide-react";

interface RequestCardProps {
  request: {
    id: string;
    type: 'incoming' | 'sent';
    sender_id?: string;
    receiver_id?: string;
    full_name: string;
    profile_pic_url?: string;
    subject?: string;
    institution?: string;
    timestamp: string;
  };
  onAccept?: (id: string) => void;
  onIgnore?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export default function RequestCard({ request, onAccept, onIgnore, onCancel }: RequestCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white p-3.5 rounded-lg border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <div className="relative">
          <UserAvatar
            src={request.profile_pic_url}
            name={request.full_name}
            className="relative w-11 h-11 rounded-lg shadow-sm border-2 border-white z-10"
          />
      </div>

      <div className="flex-grow min-w-0">
        <h4 className="font-bold text-sm text-gray-900 truncate oswald-font tracking-tight mb-0.5">{request.full_name}</h4>
        <p className="text-xs text-indigo-500 font-bold truncate brcob-font uppercase tracking-wide opacity-80">
          {request.subject} {request.institution ? `@ ${request.institution}` : ""}
        </p>
        <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 rounded-md border border-gray-100">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500 font-bold uppercase tracking-tight brcob-font">{request.timestamp}</span>
            </div>
        </div>
      </div>

      <div className="flex gap-1.5 shrink-0">
        {request.type === 'incoming' ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onIgnore?.(request.id)}
              className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 border border-transparent hover:border-red-100"
              title="Ignore"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAccept?.(request.id)}
              className="p-2 rounded-lg bg-[var(--color-primary)] text-white hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg shadow-indigo-500/20"
              title="Accept"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onCancel?.(request.id)}
            className="px-3 py-1 text-xs font-bold uppercase tracking-wide border border-gray-200 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all oswald-font"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}
