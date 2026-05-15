"use client";
import { motion } from "framer-motion";

export default function PeopleYouMayKnow() {
  const people = [
    { name: "Dhivya Rajendran", role: "HR Business Partner" },
    { name: "Vemuganti Sri Harshini", role: "Clinical Business Analyst" },
    { name: "Sandhiya Ganesan", role: "Process Executive" },
  ];

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all">
      <h2 className="text-xl font-semibold mb-4">People you may know</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
        {people.map((p, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05 }}
            className="p-5 rounded-lg shadow-sm bg-gradient-to-br from-white to-gray-50 flex flex-col items-center transition"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-full mb-3" />
            <h3 className="font-medium text-gray-900">{p.name}</h3>
            <p className="text-sm text-gray-500">{p.role}</p>
            <button className="mt-3 px-4 py-1 text-sm bg-[var(--color-primary)] cursor-pointer text-white rounded-lg shadow">
              Connect
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
