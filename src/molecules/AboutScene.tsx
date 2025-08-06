import { Html, Float } from "@react-three/drei";
import { match } from "ts-pattern";
import { useGameStore } from "@/store/gameStore";
import { ROUTE_IDS } from "@/store";
import { THEME_COLORS, THEME_IDS } from "@/store/themeConfig";
import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuestSystem } from "@/hooks/useQuestSystem";

export function AboutScene() {
  const { currentTheme, routes, taps } = useGameStore();
  const { currentQuests, triggerInteraction } = useQuestSystem();
  const [interactedElements, setInteractedElements] = useState<Set<string>>(
    new Set()
  );

  // Memoized theme data
  const aboutRoute = useMemo(
    () => routes.find((r) => r.id === ROUTE_IDS.ABOUT),
    [routes]
  );

  const themeColors = useMemo(
    () =>
      match(currentTheme?.id)
        .with(THEME_IDS.DARK, () => THEME_COLORS[THEME_IDS.DARK])
        .with(THEME_IDS.PASTEL, () => THEME_COLORS[THEME_IDS.PASTEL])
        .with(THEME_IDS.NEON, () => THEME_COLORS[THEME_IDS.NEON])
        .otherwise(() => THEME_COLORS[THEME_IDS.DEFAULT]),
    [currentTheme?.id]
  );

  // Memoized interaction handler
  const handleElementInteraction = useCallback(
    (elementId: string) => {
      setInteractedElements(
        (prev) => new Set(Array.from(prev).concat([elementId]))
      );

      // Trigger quest interaction
      triggerInteraction(elementId);
    },
    [triggerInteraction]
  );

  return (
    <group>
      {/* Interactive Background Section */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[-5, -2, -15]}>
          <Html position={[0, 0, 0]} transform>
            <motion.div
              style={{
                background: "rgba(0, 0, 0, 0.8)",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
                maxWidth: "250px",
                opacity: interactedElements.has("background") ? 1 : 0.8,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleElementInteraction("background")}
            >
              <h3 style={{ color: "#ffd700", marginBottom: "10px" }}>
                Background
              </h3>
              <p
                style={{ color: "white", fontSize: "14px", lineHeight: "1.4" }}
              >
                Full-stack developer with expertise in React, TypeScript, and
                modern web technologies.
              </p>
              <p
                style={{ color: "white", fontSize: "14px", lineHeight: "1.4" }}
              >
                Passionate about creating intuitive user experiences and
                scalable applications.
              </p>
              {interactedElements.has("background") && (
                <div
                  style={{
                    color: "#4ade80",
                    fontSize: "12px",
                    marginTop: "8px",
                  }}
                >
                  ✓ Interacted
                </div>
              )}
            </motion.div>
          </Html>
        </group>
      </Float>

      {/* Interactive Skills Section */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[5, -2, -15]}>
          <Html position={[0, 0, 0]} transform>
            <motion.div
              style={{
                background: "rgba(0, 0, 0, 0.8)",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                cursor: "pointer",
                maxWidth: "250px",
                opacity: interactedElements.has("skills") ? 1 : 0.8,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleElementInteraction("skills")}
            >
              <h3 style={{ color: "#ffd700", marginBottom: "10px" }}>Skills</h3>
              <div
                style={{ color: "white", fontSize: "14px", lineHeight: "1.4" }}
              >
                <p>
                  <strong>Frontend:</strong> React, TypeScript, Next.js
                </p>
                <p>
                  <strong>Backend:</strong> Node.js, Python, PostgreSQL
                </p>
                <p>
                  <strong>Tools:</strong> Git, Docker, AWS, CI/CD
                </p>
              </div>
              {interactedElements.has("skills") && (
                <div
                  style={{
                    color: "#4ade80",
                    fontSize: "12px",
                    marginTop: "8px",
                  }}
                >
                  ✓ Interacted
                </div>
              )}
            </motion.div>
          </Html>
        </group>
      </Float>
    </group>
  );
}
