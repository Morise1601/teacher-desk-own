"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

export default function Invitations() {
  const invites = [
    { name: "Newman Ambani", role: "Publishing Program Coordinator", company: "Oxford University Press EA Ltd", img: "https://randomuser.me/api/portraits/men/32.jpg", joinedOn: "July 18, 2025" },
    { name: "Harshini Sri", role: "Clinical Business Analyst", company: "Cinion Ltd", img: "https://randomuser.me/api/portraits/women/45.jpg", joinedOn: "August 2, 2025" },
    { name: "Balaji Sirugudi", role: "Full Stack Developer", company: "Lattech", img: "https://randomuser.me/api/portraits/men/76.jpg", joinedOn: "September 5, 2025" },
    { name: "Aarav Mehta", role: "Product Designer", company: "DesignX Studio", img: "https://randomuser.me/api/portraits/men/11.jpg", joinedOn: "September 12, 2025" },
    { name: "Nisha Kapoor", role: "HR Manager", company: "Global Corp", img: "https://randomuser.me/api/portraits/women/12.jpg", joinedOn: "June 25, 2025" },
    { name: "Raghav Sen", role: "Software Engineer", company: "Tech Solutions", img: "https://randomuser.me/api/portraits/men/23.jpg", joinedOn: "July 30, 2025" },
    { name: "Sneha Reddy", role: "Marketing Lead", company: "BrandWorks", img: "https://randomuser.me/api/portraits/women/34.jpg", joinedOn: "August 10, 2025" },
    { name: "Karthik Rao", role: "UI/UX Designer", company: "Creative Minds", img: "https://randomuser.me/api/portraits/men/56.jpg", joinedOn: "September 8, 2025" },
    { name: "Meera Nair", role: "Content Writer", company: "WriteRight", img: "https://randomuser.me/api/portraits/women/67.jpg", joinedOn: "September 15, 2025" },
    { name: "Arjun Das", role: "Product Manager", company: "InnovateX", img: "https://randomuser.me/api/portraits/men/78.jpg", joinedOn: "September 18, 2025" },
  ];

  const [showAll, setShowAll] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [list, setList] = useState(invites);

  const menuRef = useRef<HTMLDivElement>(null);
  const visibleInvites = showAll ? list : list.slice(0, 4);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all relative">
      {/* Title + More Menu */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Invitations</h2>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-1 rounded-full hover:bg-gray-100 transition"
          >
            <HiOutlineDotsHorizontal className="w-5 h-5 text-gray-600" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg z-50 overflow-hidden border"
              >
                <button
                  onClick={() => {
                    setShowAll(!showAll);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                >
                  {showAll ? "Show less" : "Show more"}
                </button>
                <button
                  onClick={() => {
                    setList([...list].reverse());
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                >
                  Sort by latest
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {visibleInvites.map((invite, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-r from-white to-blue-50 shadow-sm hover:shadow-md p-4 rounded-lg 
             flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              {/* User Info */}
              <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 text-center sm:text-left">
                <Image
                  src={invite.img}
                  alt={invite.name}
                  width={60}
                  height={60}
                  className="rounded-full object-cover border shadow-sm"
                />
                <div>
                  <p className="font-medium text-gray-900 hover:underline cursor-pointer">{invite.name}</p>
                  <p className="text-sm text-gray-600 line-clamp-1">{invite.role}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{invite.company}</p>
                  <p className="text-xs text-gray-400">Connected on {invite.joinedOn}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-center shrink-0">
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">Ignore</button>
                <button className="px-3 py-1 text-sm bg-[var(--color-primary)] text-white rounded-lg shadow hover:bg-[#0f2c4a] transition">Accept</button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
