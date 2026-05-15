'use client';

import React from 'react';
import Link from 'next/link';

const UpcomingTasks = () => {
    const tasks = [
        { id: 1, title: 'Math Quiz - Calculus', dueDate: 'Tomorrow, 11:59 PM' },
        { id: 2, title: 'Physics Lab Report', dueDate: 'Friday, 5:00 PM' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 w-full">
            <h3 className="text-[15px] font-bold text-gray-800 mb-4 brcob-font">Upcoming</h3>

            {tasks.length > 0 ? (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="group cursor-pointer">
                            <p className="text-[13px] text-gray-400 font-medium mb-0.5 capitalize tracking-wider">Due {task.dueDate}</p>
                            <h4 className="text-[14px] text-[var(--color-primary)] font-semibold group-hover:underline">
                                {task.title}
                            </h4>
                        </div>
                    ))}
                    <div className="pt-2">
                        <Link href="#" className="text-[14px] font-bold text-[var(--color-secondary)] hover:opacity-80 transition-opacity">
                            View all
                        </Link>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500">No work due soon</p>
            )}
        </div>
    );
};

export default UpcomingTasks;
