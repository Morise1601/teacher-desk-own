"use client";
import { motion } from "framer-motion";

export default function HiringForRole() {
  const roles = [
    { title: "LinkedIn Member", desc: "Expert Level Service" },
    { title: "Technical Recruiter", desc: "Echo IT Solutions" },
  ];

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all">
      <h2 className="text-xl font-semibold mb-4">People who are hiring for your role</h2>
      <div className="flex gap-5 overflow-x-auto scrollbar-hide p-2">
        {roles.map((role, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="min-w-[220px] rounded-lg p-5 bg-gradient-to-r from-white to-blue-50 shadow-sm hover:shadow-md flex flex-col items-start"
          >
            <h3 className="font-medium text-gray-900">{role.title}</h3>
            <p className="text-sm text-gray-500">{role.desc}</p>
            <button className="mt-4 px-4 py-2 text-sm bg-[var(--color-primary)] cursor-pointer text-white rounded-lg shadow">
              View profile
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
