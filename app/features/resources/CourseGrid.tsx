'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiStar, FiUser, FiBarChart, FiChevronRight } from 'react-icons/fi';

const COURSES = [
    {
        id: 1,
        title: "Advanced Teacher training: Excellence in Pedagogy",
        instructor: "Dr. Emily Roberts",
        level: "Beginner",
        rating: 4.8,
        reviews: 124,
        image: "/images/resources/course-teaching.png",
        category: "Pedagogy",
        price: "Free",
        enrolled: "1.2k+"
    },
    {
        id: 2,
        title: "Digital Classroom: Mastering Online Tools",
        instructor: "Michael Peterson",
        level: "Intermediate",
        rating: 4.9,
        reviews: 89,
        image: "/images/resources/course-digital.png",
        category: "Digital Tools",
        price: "$49.99",
        enrolled: "800+"
    },
    {
        id: 3,
        title: "Innovative Teaching Methods for Modern Students",
        instructor: "Sarah Collins",
        level: "Expert",
        rating: 4.7,
        reviews: 215,
        image: "/images/resources/course-pedagogy.png",
        category: "Innovation",
        price: "Premium",
        enrolled: "2.1k+"
    },
    {
        id: 4,
        title: "Modern Student Assessment & Tracking Strategies",
        instructor: "Robert Brown",
        level: "All Levels",
        rating: 4.6,
        reviews: 56,
        image: "/images/resources/course-assessment.png",
        category: "Assessment",
        price: "$29.99",
        enrolled: "1.5k+"
    }
];

export default function CourseGrid() {
    return (
        <section className="bg-gray-50/50 py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold oswald-font text-[var(--color-primary)] mb-3 capitalize">
                            Explore Our Courses
                        </h2>
                        <p className="text-gray-500 max-w-xl brcob-font text-sm md:text-base">
                            Curated learning paths designed to enhance your professional profile and improve student outcomes.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                        <button className="flex-grow sm:flex-grow-0 bg-white border border-gray-200 text-gray-700 px-5 md:px-8 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all active:scale-95">
                            Most Popular
                        </button>
                        <button className="flex-grow sm:flex-grow-0 bg-white border border-gray-200 text-gray-700 px-5 md:px-8 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold shadow-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all active:scale-95">
                            Newest
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {COURSES.map((course, idx) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="bg-white rounded-lg overflow-hidden shadow-xl group border border-gray-100 flex flex-col"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <Image
                                    src={course.image}
                                    alt={course.title}
                                    width={400}
                                    height={200}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[var(--color-primary)] capitalize tracking-wider shadow-sm">
                                    {course.category}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </div>

                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-center text-xs text-amber-500 font-bold mb-3 gap-1">
                                    <FiStar className="fill-current" />
                                    <span>{course.rating}</span>
                                    <span className="text-gray-400 font-normal">({course.reviews} reviews)</span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 oswald-font mb-4 line-clamp-2 leading-tight flex-grow capitalize">
                                    {course.title}
                                </h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <FiUser className="mr-2" />
                                        <span>{course.instructor}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <FiBarChart className="mr-2" />
                                        <span>{course.level}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                    <span className="text-lg font-bold text-[var(--color-primary)] oswald-font">
                                        {course.price}
                                    </span>
                                    <button className="w-10 h-10 bg-gray-100 hover:bg-[var(--color-primary)] hover:text-white rounded-full flex items-center justify-center transition-all group/btn shadow-sm">
                                        <FiChevronRight className="text-xl group-hover/btn:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <button className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white px-10 py-4 rounded-lg font-bold capitalize tracking-wider oswald-font shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        Show More Courses
                    </button>
                </div>
            </div>
        </section>
    );
}
