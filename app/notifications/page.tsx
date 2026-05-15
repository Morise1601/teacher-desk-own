// pages/notifications.tsx
"use client";

import React, { JSX, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../shared/NavBar';
import Footer from '../shared/Footer';
import Modal from '../shared/Modal';
import { UserProfile } from '../features/profile/miniUserInfo';
import { FaCheckCircle, FaPlus, FaRegUserCircle, FaRegComment } from 'react-icons/fa';

// Notification type
interface Notification {
  id: number;
  type: string;
  icon: JSX.Element;
  title: string;
  description: string;
}

// Mock Notifications
const allNotifications: Notification[] = [
  { id: 1, type: 'All', icon: <FaRegUserCircle />, title: 'New Follower', description: 'Jane Doe started following you.' },
  { id: 2, type: 'Activity', icon: <FaRegComment />, title: 'New Message', description: 'You have a new message from John Smith.' },
  { id: 3, type: 'All', icon: <FaCheckCircle />, title: 'Task Completed', description: 'Your task "Finish Report" is now complete.' },
  { id: 4, type: 'Mentions', icon: <FaRegUserCircle />, title: 'Profile Mention', description: '@Michael_B tagged you in a post.' },
  { id: 5, type: 'Activity', icon: <FaPlus />, title: 'New Comment', description: 'Alex commented on your latest photo.' },
];

const tabs = ['All', 'Activity', 'Mentions'];

const TabButton = ({ text, active, setActive }: { text: string; active: boolean; setActive: (t: string) => void }) => (
  <motion.div
    layout
    onClick={() => setActive(text)}
    className="relative px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer"
    animate={{
      backgroundColor: active ? 'var(--color-primary)' : '#f3f4f6',
      color: active ? '#ffffff' : '#374151',
    }}
    whileHover={{
      scale: 1.05,
      backgroundColor: active ? 'var(--color-primary)' : '#e5e7eb',
    }}
    whileTap={{ scale: 0.95 }}
  >
    {text}
  </motion.div>
);

const NotificationCard = ({ notification, onClick }: { notification: Notification; onClick: (n: Notification) => void }) => (
  <motion.div
    layout
    className="flex items-center p-4 rounded-lg shadow-sm cursor-pointer bg-white hover:bg-gray-50 transition m-3"
    whileHover={{ scale: 1.02 }}
    onClick={() => onClick(notification)}
  >
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-100 text-blue-600">
      {notification.icon}
    </div>
    <div className="ml-4 flex-1">
      <h3 className="font-semibold text-gray-800">{notification.title}</h3>
      <p className="text-gray-500 text-sm">{notification.description}</p>
    </div>
  </motion.div>
);

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [comments, setComments] = useState<{ id: number, user: string, text: string }[]>([
    { id: 1, user: 'Alice', text: 'Nice post! 👍' },
    { id: 2, user: 'Bob', text: 'Thanks for sharing 😄' },
  ]);
  const [newComment, setNewComment] = useState('');

  const filteredNotifications = allNotifications.filter(n => activeTab === 'All' ? true : n.type === activeTab);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, { id: Date.now(), user: 'You', text: newComment }]);
    setNewComment('');
  }

  return (
    <div>
      <Navbar />

      <div className="bg-[#f0f4f8] min-h-[calc(100vh-140px)] p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Left: User Profile */}
          <div className="lg:w-1/3 xl:w-1/4 shrink-0">
            <UserProfile />
          </div>

          {/* Right: Notifications */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <header className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold oswald-font text-[var(--color-primary)]">Notifications</h1>
            </header>

            <nav className="flex flex-wrap gap-2 sm:gap-4 mb-6 p-2 bg-gray-50 rounded-lg shadow-inner">
              {tabs.map(tab => <TabButton key={tab} text={tab} active={activeTab === tab} setActive={setActiveTab} />)}
            </nav>

            <motion.div layout className="space-y-2 max-h-[calc(100vh-320px)] sidebar-scroll pr-2">
              <AnimatePresence mode="wait">
                {filteredNotifications.length ? filteredNotifications.map(n => (
                  <NotificationCard key={n.id} notification={n} onClick={setSelectedNotification} />
                )) : (
                  <p className="text-gray-500 text-center py-6">No notifications in this category.</p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.title}
      >
        {selectedNotification && (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: User Info */}
            <div className="flex-shrink-0 w-full md:w-1/4 flex flex-col items-center text-center md:text-left">
              <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-3xl text-blue-600 mb-2">
                {selectedNotification.icon}
              </div>
              <h3 className="font-bold text-gray-800">{selectedNotification.title}</h3>
              <p className="text-gray-500 text-sm">Short description of the user</p>
            </div>

            {/* Body */}
            <div className="flex-1">
              <p className="text-gray-700 mb-3">{selectedNotification.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <div className="bg-gray-100 rounded-lg h-24 flex items-center justify-center">Image / Media</div>
              </div>

              <ul className="list-disc ml-5 mb-3 text-gray-700">
                <li>Point 1</li>
                <li>Point 2</li>
                <li>Point 3</li>
              </ul>

              <hr className="my-3 border-gray-200" />

              {/* Likes / Share */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">👍 {comments.length}</button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">💬 {comments.length}</button>
                </div>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">🔗 Share</button>
              </div>

              <hr className="border-gray-200 mb-3" />

              {/* Comment Input */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                />
                <button className="text-2xl" onClick={handleAddComment}>😊</button>
              </div>

              {/* Comment List */}
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">{c.user.charAt(0)}</div>
                    <div>
                      <p className="text-gray-800"><span className="font-semibold">{c.user}:</span> {c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Footer />
    </div>
  );
}
