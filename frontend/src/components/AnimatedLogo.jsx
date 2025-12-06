import { motion } from "framer-motion";
import React from "react";
import { BASE_URL } from "../config";
const text = "Chronos";

export default function AnimatedLogo({ color }) {
  return (
    <motion.div
      style={{
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: 1,
        color,
        display: "flex",
        overflow: "hidden",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {text.split("").map((letter, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: i * 0.15, // <-- печатаем буквы по очереди
            duration: 0.35,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: 1.5, // <-- пауза между циклами
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
}
