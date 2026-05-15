// pages/manage-network.jsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HiUserGroup, HiUsers, HiOutlineCalendar, HiOutlineFlag, HiOutlineNewspaper, HiOutlineMail } from "react-icons/hi";

const networkItems = [
  { title: "Connections", count: 33, icon: <HiUserGroup className="w-6 h-6 text-blue-500" /> },
  { title: "Following & Followers", count: 98, icon: <HiUsers className="w-6 h-6 text-green-500" /> },
  { title: "Groups", count: 21, icon: <HiOutlineFlag className="w-6 h-6 text-purple-500" /> },
  { title: "Events", count: 45, icon: <HiOutlineCalendar className="w-6 h-6 text-yellow-500" /> },
  { title: "Pages", count: 111, icon: <HiOutlineNewspaper className="w-6 h-6 text-red-500" /> },
  { title: "Newsletters", count: 16, icon: <HiOutlineMail className="w-6 h-6 text-pink-500" /> },
];

export default function ManageNetwork() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        className="bg-white shadow-xl rounded-lg w-full max-w-md p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage my network</h2>

        <div className="grid gap-4">
          <AnimatePresence>
            {networkItems.map((item, index) => (
              <motion.button
                key={item.title}
                className="flex justify-between items-center p-4 bg-gray-100 rounded-lg shadow hover:bg-blue-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-gray-700 font-medium">{item.title}</span>
                </div>
                <span className="text-gray-500 font-semibold">{item.count}</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
