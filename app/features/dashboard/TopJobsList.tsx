'use client';

import React from 'react';
import { motion } from 'framer-motion';

const topJobs = [
    { id: 1, title: 'Senior Product Designer', rate: '$25/hr', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { id: 2, title: 'Senior UI / UX Designer', rate: '$25/hr', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { id: 3, title: 'Junior Seo Designer', rate: '$25/hr', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { id: 4, title: 'Senior PHP Designer', rate: '$25/hr', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
    { id: 5, title: 'Senior Developer Designer', rate: '$25/hr', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
];

export default function TopJobsList({ jobs }: { jobs?: any[] }) {
    const list = jobs || topJobs;
    return (
        <motion.div
            className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
            whileHover={{ boxShadow: "0 0 15px rgba(0,0,0,0.05)" }}
        >
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Top Jobs</h3>
            <ul className="space-y-4">
                {list.map(job => (
                    <motion.li
                        key={job.id}
                        className="pb-2 border-b border-gray-100 last:border-b-0"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <p className="font-medium text-gray-700">{job.title}</p>
                            <span className="text-sm text-gray-600 font-bold">{job.rate}</span>
                        </div>
                        <p className="text-xs text-gray-500">{job.description}</p>
                    </motion.li>
                ))}
            </ul>
        </motion.div>
    );
}
