"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineSearch, HiOutlineTrash } from "react-icons/hi";
import { toast, ToastContainer } from 'react-toastify';
import Modal from '../../shared/Modal';
import Image from "next/image";

// Mock Data
const initialConnections = [
  {
    id: 1,
    name: "Sirugudi Balaji",
    role: "Full Stack Developer at Lattech",
    date: "September 27, 2025",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    name: "Purushothaman SKR",
    role: "MERN Stack Developer | Skilled in React.js, Node.js, MongoDB, Express.js",
    date: "September 3, 2025",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: 3,
    name: "Hinduja Natarajan",
    role: "Senior HR Executive at Integra Software Services",
    date: "August 23, 2025",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    id: 4,
    name: "Manthan Togadiya",
    role: "K-12 EdTech Solution Architect | Adaptive content | RAG",
    date: "August 18, 2025",
    avatar: "https://i.pravatar.cc/150?img=4",
  },
  {
    id: 5,
    name: "Aishwarya Rajan",
    role: "UI/UX Designer at PixelPerfect",
    date: "July 15, 2025",
    avatar: "https://i.pravatar.cc/150?img=5",
  },
  {
    id: 6,
    name: "Karthik V",
    role: "Data Scientist | Machine Learning Enthusiast",
    date: "July 2, 2025",
    avatar: "https://i.pravatar.cc/150?img=6",
  },
  {
    id: 7,
    name: "Meera S",
    role: "Frontend Developer | React & TypeScript",
    date: "June 29, 2025",
    avatar: "https://i.pravatar.cc/150?img=7",
  },
  {
    id: 8,
    name: "Rohit Sharma",
    role: "DevOps Engineer at CloudOps",
    date: "June 12, 2025",
    avatar: "https://i.pravatar.cc/150?img=8",
  },
  {
    id: 9,
    name: "Sneha Iyer",
    role: "Content Strategist | Social Media Expert",
    date: "May 30, 2025",
    avatar: "https://i.pravatar.cc/150?img=9",
  },
  {
    id: 10,
    name: "Vikram Joshi",
    role: "Backend Developer | Node.js & Express",
    date: "May 18, 2025",
    avatar: "https://i.pravatar.cc/150?img=10",
  },
  {
    id: 11,
    name: "Ananya Kapoor",
    role: "Marketing Specialist | SEO & Growth",
    date: "May 5, 2025",
    avatar: "https://i.pravatar.cc/150?img=11",
  },
  {
    id: 12,
    name: "Deepak Nair",
    role: "Cybersecurity Analyst | Ethical Hacker",
    date: "April 28, 2025",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: 13,
    name: "Priya Menon",
    role: "Product Manager | Agile & Scrum Certified",
    date: "April 15, 2025",
    avatar: "https://i.pravatar.cc/150?img=13",
  },
  {
    id: 14,
    name: "Arjun Reddy",
    role: "AI Engineer | TensorFlow & PyTorch",
    date: "April 1, 2025",
    avatar: "https://i.pravatar.cc/150?img=14",
  },
  {
    id: 15,
    name: "Lakshmi Subramanian",
    role: "HR Manager | Employee Engagement Specialist",
    date: "March 22, 2025",
    avatar: "https://i.pravatar.cc/150?img=15",
  },
  {
    id: 16,
    name: "Ramesh Kumar",
    role: "Full Stack Developer | Next.js & MongoDB",
    date: "March 10, 2025",
    avatar: "https://i.pravatar.cc/150?img=16",
  },
];


const MyConnections = () => {
  const [connections, setConnections] = useState(initialConnections);
  const [search, setSearch] = useState("");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);

  // Filter by name, role, or date
  const filteredConnections = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.date.toLowerCase().includes(search.toLowerCase())
  );

  const openConfirmationModal = (id: number) => {
    setSelectedConnectionId(id);
    setIsConfirmationModalOpen(true);
  };

  const confirmRemoveConnection = () => {
    if (selectedConnectionId === null) return;
    const user = connections.find((c) => c.id === selectedConnectionId);
    if (!user) return;

    setConnections(connections.filter((c) => c.id !== selectedConnectionId));
    toast.info(`${user.name} has been removed from your connections.`);
    setIsConfirmationModalOpen(false);
    setSelectedConnectionId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {connections.length} Connections
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors duration-200 group-focus-within:text-blue-500" />
          <input
            type="text"
            placeholder="Search by name, role, or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="group w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 placeholder-gray-400 text-gray-800 bg-white"
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          <ToastContainer />
          <AnimatePresence>
            {filteredConnections.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between 
             bg-gradient-to-r from-white to-blue-50 
             shadow-sm p-4 rounded-lg 
             transform transition duration-300 ease-in-out
             hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] gap-4"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full sm:w-auto text-center sm:text-left">
                  <Image
                    src={c.avatar}
                    alt={c.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover border shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-800 truncate">{c.name}</h2>
                    <p className="text-sm text-gray-600 line-clamp-1">{c.role}</p>
                    <p className="text-xs text-gray-400 mt-1">Connected on {c.date}</p>
                  </div>
                </div>

                <div className="flex justify-center sm:justify-end items-center gap-3 w-full sm:w-auto shrink-0 border-t sm:border-0 border-blue-100 pt-3 sm:pt-0">
                  <button className="px-4 py-1.5 text-sm bg-[var(--color-primary)] text-white rounded-lg shadow hover:bg-[#0f2c4a] transition">Message</button>
                  <button onClick={() => openConfirmationModal(c.id)} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                    <HiOutlineTrash className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredConnections.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-center mt-6"
              >
                No connections found.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        title="Confirm Deletion"
      >
        <p className="text-gray-700">Are you sure you want to remove this connection?</p>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => setIsConfirmationModalOpen(false)}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={confirmRemoveConnection}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default MyConnections;
