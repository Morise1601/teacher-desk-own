"use client";
import { motion } from "framer-motion";

export default function DailyGames() {
  const games = ["Mini Sudoku #36", "Zip #183", "Tango #344"];

  return (
    <section className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all">
      <h2 className="text-xl font-semibold mb-4">Stay in touch through daily games</h2>
      <div className="flex flex-wrap gap-4">
        {games.map((game, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05 }}
            className="px-5 py-3 border rounded-lg cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-indigo-100 hover:to-blue-100 shadow-sm"
          >
            {game}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
