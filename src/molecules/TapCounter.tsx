import { Html } from "@react-three/drei";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";

interface TapCounterProps {
  tapCount: number;
}

export function TapCounter({ tapCount }: TapCounterProps) {
  const [bounce, setBounce] = useState(false);
  const { currentTheme } = useGameStore();

  // Bounce animation every second
  useEffect(() => {
    const interval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 200);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Html position={[-8, 4, 0]}>
      <motion.div
        animate={{
          scale: bounce ? 1.2 : 1,
          y: bounce ? -5 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 10,
        }}
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "20px",
          fontSize: "16px",
          fontWeight: "bold",
          fontFamily: "monospace",
          userSelect: "none",
          pointerEvents: "none",
          border: `2px solid ${currentTheme?.colors?.accent || "#FFD700"}`,
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        {tapCount.toLocaleString()} taps
      </motion.div>
    </Html>
  );
}
