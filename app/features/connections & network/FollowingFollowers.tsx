"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineSearch } from "react-icons/hi";
import { HiOutlineUserRemove } from "react-icons/hi";
import { toast, ToastContainer } from 'react-toastify';
import Modal from '../../shared/Modal';
import Image from "next/image";

// Mock Following/Followers Data
const initialFollowing = [
  { id: 1, name: "Amit Sharma", role: "Software Engineer", date: "September 10, 2025", avatar: "https://i.pravatar.cc/150?img=17" },
  { id: 2, name: "Neha Verma", role: "Product Designer", date: "August 21, 2025", avatar: "https://i.pravatar.cc/150?img=18" },
  { id: 3, name: "Rohan Iyer", role: "DevOps Engineer", date: "July 30, 2025", avatar: "https://i.pravatar.cc/150?img=19" },
  { id: 4, name: "Priya Singh", role: "Data Scientist", date: "July 10, 2025", avatar: "https://i.pravatar.cc/150?img=20" },
  { id: 5, name: "Vikram Patel", role: "Frontend Developer", date: "June 28, 2025", avatar: "https://i.pravatar.cc/150?img=21" },
];

const FollowingFollowers = () => {
  const [following, setFollowing] = useState(initialFollowing);
  const [search, setSearch] = useState("");
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Filter by name, role, or date
  const filteredFollowing = following.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      u.date.toLowerCase().includes(search.toLowerCase())
  );

  const openConfirmationModal = (id: number) => {
    setSelectedUserId(id);
    setIsConfirmationModalOpen(true);
  };

  const confirmUnfollow = () => {
    if (selectedUserId === null) return;
    const user = following.find((u) => u.id === selectedUserId);
    if (!user) return;

    setFollowing(following.filter((u) => u.id !== selectedUserId));
    toast.info(`You have unfollowed ${user.name}.`);
    setIsConfirmationModalOpen(false);
    setSelectedUserId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {following.length} Following
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
            {filteredFollowing.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row items-center sm:justify-between 
                  bg-gradient-to-r from-white to-blue-50 shadow-sm p-4 rounded-lg 
                  transform transition duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <Image
                    src={u.avatar}
                    alt={u.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover border shadow-sm mb-2 sm:mb-0"
                  />
                  <div className="text-center sm:text-left">
                    <h2 className="font-semibold text-gray-800">{u.name}</h2>
                    <p className="text-sm text-gray-600">{u.role}</p>
                    <p className="text-xs text-gray-400">
                      Following since {u.date}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center items-center gap-3 mt-4 w-full sm:mt-0 sm:w-auto">
                  <button
                    onClick={() => openConfirmationModal(u.id)}
                    className="px-4 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center gap-1 justify-center w-full sm:w-auto"
                  >
                    <HiOutlineUserRemove className="w-5 h-5 text-red-600" />
                    Unfollow
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredFollowing.length === 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-center mt-6"
              >
                No users found.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        title="Confirm Unfollow"
      >
        <p className="text-gray-700">Are you sure you want to unfollow this user?</p>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => setIsConfirmationModalOpen(false)}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={confirmUnfollow}
            className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Unfollow
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default FollowingFollowers
