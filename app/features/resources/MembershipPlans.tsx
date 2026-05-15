'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiZap, FiShield, FiStar } from 'react-icons/fi';

const PLANS = [
    {
        name: "Basic",
        icon: <FiZap className="text-2xl" />,
        price: "Free",
        features: ["Access to 10+ basic courses", "Community forum access", "Digital completion certificates", "Email support"],
        buttonText: "Start for Free",
        popular: false,
    },
    {
        name: "Professional",
        icon: <FiStar className="text-2xl" />,
        price: "$19.99/mo",
        features: ["Access to all courses", "Monthly live webinars", "Premium resources & templates", "Priority support", "No ads", "Offline viewing"],
        buttonText: "Join Pro",
        popular: true,
    },
    {
        name: "Institutional",
        icon: <FiShield className="text-2xl" />,
        price: "Custom",
        features: ["Everything in Pro", "Team management tools", "Bulk enrollments", "Custom branding", "Dedicated success manager", "White-label reports"],
        buttonText: "Contact Us",
        popular: false,
    }
];

export default function MembershipPlans() {
    return (
        <section className="relative py-20 md:py-32 overflow-hidden">
            <div className="absolute inset-0 bg-white/40 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
                <div className="text-center mb-16 md:mb-24">
                    <h2 className="text-3xl md:text-5xl font-bold oswald-font text-[var(--color-primary)] mb-4 capitalize tracking-tighter leading-tight">
                        Unlock Your Teaching Potential
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto brcob-font text-base md:text-lg px-2 text-balance">
                        Choose a plan that fits your professional needs and start your journey today.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.2 }}
                            whileHover={{ y: -10 }}
                            className={`rounded-lg p-8 flex flex-col relative overflow-hidden shadow-2xl ${plan.popular
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-white text-gray-800"
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-[var(--color-secondary)] text-white text-[10px] font-bold capitalize px-6 py-2 rounded-bl-[2rem] tracking-widest">
                                    Most Popular
                                </div>
                            )}

                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-6 shadow-xl ${plan.popular ? "bg-white/20" : "bg-gray-100"
                                }`}>
                                {plan.icon}
                            </div>

                            <h3 className="text-2xl font-bold oswald-font mb-2 capitalize">{plan.name}</h3>
                            <div className="mb-8">
                                <span className="text-4xl font-bold oswald-font">{plan.price}</span>
                                {plan.price !== "Custom" && plan.name !== "Basic" && <span className="text-sm font-light opacity-70">/mo</span>}
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start text-sm">
                                        <FiCheck className={`mr-3 mt-1 flex-shrink-0 ${plan.popular ? "text-white" : "text-green-500"}`} />
                                        <span className={plan.popular ? "text-white/80" : "text-gray-600"}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={`w-full py-4 rounded-lg font-bold oswald-font capitalize tracking-widest shadow-lg transition-all active:scale-95 ${plan.popular
                                ? "bg-white text-[var(--color-primary)] hover:bg-white/90"
                                : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-secondary)]"
                                }`}>
                                {plan.buttonText}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
