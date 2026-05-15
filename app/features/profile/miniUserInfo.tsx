"use client";

import React from "react";
import { motion } from "framer-motion";
import { LuBuilding2 } from "react-icons/lu";
import { FaMapPin } from "react-icons/fa6";
import Image from "next/image";

export const UserProfile = () => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="rounded-lg overflow-hidden shadow-lg bg-white">
      {/* Banner Image */}
      <div className="relative h-20 w-full">
        <Image
          src="https://images.unsplash.com/photo-1503264116251-35a269479413" // 🔄 replace with your banner image
          alt="banner"
          fill
          className="object-cover"
        />
      </div>

      {/* Profile Section */}
      <div className="relative px-5 pb-5">
        {/* Profile Image */}
        <div className="absolute -top-22 left-5">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md">
            <Image
              src="https://picsum.photos/200/300"
              alt="profile"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-900">Benjamin Frankline</h2>
          <p className="text-sm text-gray-600 mt-1">
            Frontend Developer | Software Developer | Full stack Developer...
          </p>

          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
            <FaMapPin size={14} />
            <span>Puducherry, Puducherry</span>
          </div>

          <div className="flex items-center gap-1 text-sm font-medium text-blue-700 mt-1">
            <LuBuilding2 size={14} />
            <span>OKIT Technology</span>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);
