import { useCallback, useMemo, useRef, type Ref } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useMiniGameStore } from "@/store";
import { useQuestSystem } from "@/hooks/useQuestSystem";
import { playUISound } from "@/utils/soundSystem";
import { GradientTexture } from "@react-three/drei";

const SYMBOLS = [
  "🍒",
  "🍋",
  "🍉",
  "🍇",
  "⭐️",
  "💎",
  "🔔",
  "🍀",
  "👁️",
  "🍓",
  "🔥",
];

const REEL_COUNT = 3;
const ROW_COUNT = 1;
const ROW_SPACING = 0.65;
const REEL_SPACING = 0.95;
const SYMBOLS_PER_REEL = 6;
const REEL_RADIUS = 0.98;
const REEL_THICKNESS = 0.7;
const ROW_OFFSET = (ROW_COUNT - 1) * 0.5;

const MACHINE_WIDTH = 3.6;
const MACHINE_HEIGHT = 4.4;
const MACHINE_DEPTH = 1.8;

const REEL_PANEL_Y = 2.35;
const REEL_PANEL_Z = MACHINE_DEPTH * 0.49;
const HIGHLIGHT_WIDTH = REEL_SPACING * 2 + 0.9;
const HIGHLIGHT_HEIGHT = 1.75;
const HIGHLIGHT_Z = MACHINE_DEPTH * 0.515;

type ReelRuntime = {
  rows: number[][];
  angle: number;
  isSpinning: boolean;
  speed: number;
  stopAt: number;
};

type LeverPhase = "idle" | "pull";

const emojiTextureCache = new Map<string, THREE.CanvasTexture>();

const SYMBOL_PAYOUTS: Record<string, number> = {
  "🍒": 1,
  "🍋": 1,
  "🍉": 1,
  "🍇": 1,
  "🍓": 1,
  "🔔": 2,
};

const PAYOUT_SYMBOL_INDICES = SYMBOLS.flatMap((symbol, index) =>
  SYMBOL_PAYOUTS[symbol] ? [index] : [],
);

const shuffle = <T,>(items: T[]) => {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
};

const createReelStrip = () => {
  const pool =
    PAYOUT_SYMBOL_INDICES.length > 0
      ? [...PAYOUT_SYMBOL_INDICES]
      : SYMBOLS.map((_, index) => index);

  if (pool.length >= SYMBOLS_PER_REEL) {
    return shuffle(pool).slice(0, SYMBOLS_PER_REEL);
  }

  const strip = [...pool];
  while (strip.length < SYMBOLS_PER_REEL) {
    strip.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return shuffle(strip);
};

const rotateStrip = (strip: number[], offset: number) =>
  strip.map((_, index) => strip[(index + offset) % strip.length]);

const getPayoutForSymbol = (symbolIndex: number) =>
  SYMBOL_PAYOUTS[SYMBOLS[symbolIndex]] ?? 0;

const getEmojiTexture = (symbol: string) => {
  if (typeof document === "undefined") return null;

  const cached = emojiTextureCache.get(symbol);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font =
    "160px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  ctx.fillText(symbol, size / 2, size / 2 + 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  emojiTextureCache.set(symbol, texture);

  return texture;
};

const TWO_PI = Math.PI * 2;
const ANGLE_STEP = TWO_PI / SYMBOLS_PER_REEL;

const normalizeAngle = (angle: number) => {
  const normalized = angle % TWO_PI;
  return normalized < 0 ? normalized + TWO_PI : normalized;
};

const getFrontIndex = (angle: number) =>
  Math.round(normalizeAngle(angle) / ANGLE_STEP) % SYMBOLS_PER_REEL;

const getWinningLines = (reels: ReelRuntime[]) => {
  const wins: Array<{ row: number; symbolIndex: number; payout: number }> = [];

  for (let row = 0; row < ROW_COUNT; row += 1) {
    const a = reels[0].rows[row][getFrontIndex(reels[0].angle)];
    const b = reels[1].rows[row][getFrontIndex(reels[1].angle)];
    const c = reels[2].rows[row][getFrontIndex(reels[2].angle)];
    if (a === b && b === c) {
      const payout = getPayoutForSymbol(a);
      if (payout > 0) {
        wins.push({ row, symbolIndex: a, payout });
      }
    }
  }

  return wins;
};

const SlotMachineBody = ({
  reels,
  onTrigger,
  machineRef,
  leverRef,
  setReelGroupRef,
  position = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  reels: number[][][];
  onTrigger?: () => void;
  machineRef?: Ref<THREE.Group>;
  leverRef?: Ref<THREE.Group>;
  setReelGroupRef?: (index: number) => (node: THREE.Group | null) => void;
  position?: [number, number, number];
  scale?: [number, number, number];
}) => {
  const reelDrumGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(
      REEL_RADIUS * 0.98,
      REEL_RADIUS * 0.98,
      REEL_THICKNESS,
      32,
      1,
      true,
    );
    geometry.rotateZ(Math.PI / 2);
    return geometry;
  }, []);

  const reelDrumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ece7da",
        roughness: 0.65,
        metalness: 0.1,
      }),
    [],
  );

  const handlePointerDown = onTrigger
    ? (event: any) => {
        event.stopPropagation();
        onTrigger();
      }
    : undefined;

  return (
    <group
      ref={machineRef}
      position={position}
      scale={scale}
      onPointerDown={handlePointerDown}
    >
      <mesh position={[0, MACHINE_HEIGHT * 0.5, 0]} castShadow>
        <boxGeometry args={[MACHINE_WIDTH, MACHINE_HEIGHT, MACHINE_DEPTH]} />
        <meshToonMaterial color="#d23b42" />
      </mesh>

      <mesh position={[0, MACHINE_HEIGHT * 0.48, MACHINE_DEPTH * 0.25]}>
        <boxGeometry
          args={[MACHINE_WIDTH * 0.92, MACHINE_HEIGHT * 0.85, 0.12]}
        />
        <meshToonMaterial color="#ffcf6d" />
      </mesh>

      <mesh position={[0, MACHINE_HEIGHT * 0.18, MACHINE_DEPTH * 0.48]}>
        <boxGeometry args={[MACHINE_WIDTH * 0.75, 0.45, 0.2]} />
        <meshToonMaterial color="#5c1113" />
      </mesh>

      <mesh position={[0, REEL_PANEL_Y, MACHINE_DEPTH * 0.32]}>
        <boxGeometry args={[MACHINE_WIDTH * 0.78, 2.25, 0.12]} />
        <meshToonMaterial color="#2d1c21" />
      </mesh>

      <group position={[0, REEL_PANEL_Y, REEL_PANEL_Z]}>
        {reels.map((rows, reelIndex) => (
          <group
            key={`reel-${reelIndex}`}
            ref={setReelGroupRef ? setReelGroupRef(reelIndex) : undefined}
            position={[(reelIndex - 1) * REEL_SPACING, 0, MACHINE_DEPTH * 0.02]}
          >
            {rows.map((_, rowIndex) => (
              <mesh
                key={`reel-drum-${reelIndex}-${rowIndex}`}
                geometry={reelDrumGeometry}
                material={reelDrumMaterial}
                position={[0, (ROW_OFFSET - rowIndex) * ROW_SPACING, 0]}
                castShadow
              />
            ))}
            {rows.map((symbols, rowIndex) => (
              <group
                key={`reel-row-${reelIndex}-${rowIndex}`}
                position={[0, (ROW_OFFSET - rowIndex) * ROW_SPACING, 0]}
              >
                {symbols.map((symbolIndex, symbolSlot) => {
                  const theta = (symbolSlot / symbols.length) * TWO_PI;
                  return (
                    <mesh
                      key={`symbol-${reelIndex}-${rowIndex}-${symbolSlot}`}
                      position={[
                        0,
                        Math.sin(theta) * (REEL_RADIUS + 0.05),
                        Math.cos(theta) * (REEL_RADIUS + 0.05),
                      ]}
                      rotation={[-theta, 0, 0]}
                    >
                      <planeGeometry args={[0.8, 0.8]} />
                      <meshBasicMaterial
                        map={getEmojiTexture(SYMBOLS[symbolIndex]) ?? undefined}
                        transparent
                        alphaTest={0.35}
                        side={THREE.FrontSide}
                        toneMapped={false}
                        depthWrite={false}
                        polygonOffset
                        polygonOffsetFactor={-1}
                      />
                    </mesh>
                  );
                })}
              </group>
            ))}
          </group>
        ))}
      </group>

      <mesh position={[0, REEL_PANEL_Y, MACHINE_DEPTH * 0.5]}>
        <boxGeometry args={[MACHINE_WIDTH * 0.8, 2.3, 0.02]} />
        <meshStandardMaterial
          color="#f4f1ff"
          transparent
          opacity={0.2}
          depthWrite={false}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
        <group
          key={`highlight-${rowIndex}`}
          position={[
            0,
            REEL_PANEL_Y + (ROW_OFFSET - rowIndex) * ROW_SPACING,
            HIGHLIGHT_Z,
          ]}
        >
          <mesh>
            <planeGeometry args={[HIGHLIGHT_WIDTH, HIGHLIGHT_HEIGHT]} />
            <meshBasicMaterial
              color="#fff2b5"
              transparent
              opacity={0.12}
              depthWrite={false}
            />
          </mesh>
          <lineSegments>
            <edgesGeometry
              args={[
                new THREE.PlaneGeometry(HIGHLIGHT_WIDTH, HIGHLIGHT_HEIGHT),
              ]}
            />
            <lineBasicMaterial
              color="#ffe08a"
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </lineSegments>
        </group>
      ))}

      <mesh position={[0, MACHINE_HEIGHT * 0.86, MACHINE_DEPTH * 0.48]}>
        <boxGeometry args={[MACHINE_WIDTH * 0.7, 0.6, 0.12]} />
        <meshToonMaterial color="#291218" />
      </mesh>

      <mesh position={[0, MACHINE_HEIGHT * 0.86, MACHINE_DEPTH * 0.54]}>
        <boxGeometry args={[MACHINE_WIDTH * 0.62, 0.42, 0.02]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>

      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[MACHINE_WIDTH * 0.95, 0.4, MACHINE_DEPTH * 0.85]} />
        <meshToonMaterial color="#891c23" />
      </mesh>

      <mesh position={[MACHINE_WIDTH * 0.68, 3.05, MACHINE_DEPTH * 0.28]}>
        <boxGeometry args={[0.25, 0.25, 0.3]} />
        <meshToonMaterial color="#f6b93b" />
      </mesh>

      <group
        ref={leverRef}
        position={[MACHINE_WIDTH * 0.68, 3.45, MACHINE_DEPTH * 0.28]}
      >
        <mesh position={[0, -0.55, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 12]} />
          <meshToonMaterial color="#f6b93b" />
        </mesh>
        <mesh position={[0, -1.2, 0]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshToonMaterial color="#ffe08a" />
        </mesh>
      </group>
    </group>
  );
};

export function SlotMachineGame({ onExit }: { onExit: () => void }) {
  const { incrementScore } = useMiniGameStore();
  const { triggerQuest } = useQuestSystem();

  const reelsRef = useRef<ReelRuntime[]>(
    (() => {
      const baseStrip = createReelStrip();

      return Array.from({ length: REEL_COUNT }, () => {
        const offset = Math.floor(Math.random() * SYMBOLS_PER_REEL);
        const strip = rotateStrip(baseStrip, offset);

        return {
          rows: Array.from({ length: ROW_COUNT }, () => [...strip]),
          angle: Math.floor(Math.random() * SYMBOLS_PER_REEL) * ANGLE_STEP,
          isSpinning: false,
          speed: 12,
          stopAt: 0,
        };
      });
    })(),
  );

  const machineRef = useRef<THREE.Group>(null);
  const leverRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const wasSpinningRef = useRef(false);
  const leverState = useRef<{ value: number; phase: LeverPhase }>({
    value: 0,
    phase: "idle",
  });
  const reelGroupRefs = useRef<Array<THREE.Group | null>>(
    Array.from({ length: REEL_COUNT }, () => null),
  );

  const initialReels = useMemo(
    () => reelsRef.current.map((reel) => reel.rows.map((row) => [...row])),
    [],
  );

  const setReelGroupRef = useCallback(
    (index: number) => (node: THREE.Group | null) => {
      if (!node) return;
      reelGroupRefs.current[index] = node;
    },
    [],
  );

  const createParticles = useCallback((x = 0, y = 3, z = 0, count = 80) => {
    if ((window as any).createTapParticles) {
      (window as any).createTapParticles(x, y, z, count);
    }
  }, []);

  const triggerSpin = useCallback(() => {
    if (reelsRef.current.some((reel) => reel.isSpinning)) return;

    playUISound();

    const now = timeRef.current;
    reelsRef.current.forEach((reel, index) => {
      reel.isSpinning = true;
      reel.speed = 10 + Math.random() * 6;
      reel.stopAt = now + 1.4 + index * 0.35 + Math.random() * 0.2;
    });

    leverState.current.phase = "pull";
    triggerQuest("minigames_slot_spin");
  }, [triggerQuest]);

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime();
    timeRef.current = now;

    let anySpinning = false;

    reelsRef.current.forEach((reel, index) => {
      if (reel.isSpinning) {
        anySpinning = true;

        if (now >= reel.stopAt - 0.35) {
          reel.speed = Math.max(4, reel.speed * (1 - delta * 3.2));
        }

        reel.angle += delta * reel.speed;

        if (now >= reel.stopAt) {
          reel.isSpinning = false;
          reel.angle = getFrontIndex(reel.angle) * ANGLE_STEP;
        }
      }

      const group = reelGroupRefs.current[index];
      if (group) {
        group.rotation.x = reel.angle;
      }
    });

    if (machineRef.current) {
      const targetX = anySpinning ? Math.sin(now * 40) * 0.04 : 0;
      const targetY = anySpinning ? Math.sin(now * 32) * 0.03 : 0;
      const targetRot = anySpinning ? Math.sin(now * 45) * 0.03 : 0;

      machineRef.current.position.x = THREE.MathUtils.lerp(
        machineRef.current.position.x,
        targetX,
        Math.min(1, delta * 10),
      );
      machineRef.current.position.y = THREE.MathUtils.lerp(
        machineRef.current.position.y,
        targetY,
        Math.min(1, delta * 10),
      );
      machineRef.current.rotation.z = THREE.MathUtils.lerp(
        machineRef.current.rotation.z,
        targetRot,
        Math.min(1, delta * 10),
      );
    }

    if (leverRef.current) {
      const lever = leverState.current;

      if (lever.phase === "pull") {
        lever.value = Math.min(1, lever.value + delta * 4.2);
        if (lever.value >= 1) lever.phase = "idle";
      } else if (lever.value > 0) {
        lever.value = Math.max(0, lever.value - delta * 3.6);
      }

      leverRef.current.rotation.x = 0.85 * lever.value;
    }

    if (wasSpinningRef.current && !anySpinning) {
      wasSpinningRef.current = false;
      const wins = getWinningLines(reelsRef.current);

      if (wins.length > 0) {
        const totalPoints = wins.reduce(
          (sum, win, index) => sum + win.payout * (1 + index),
          0,
        );

        for (let i = 0; i < totalPoints; i += 1) incrementScore();
        triggerQuest("minigames_slot_win", wins.length);

        wins.forEach((win) => {
          const y = REEL_PANEL_Y + (ROW_OFFSET - win.row) * ROW_SPACING;
          const count = 80 + win.payout * 35;
          createParticles(0, y, MACHINE_DEPTH * 0.6, count);
          if (win.payout >= 2) {
            createParticles(
              0,
              y + 0.25,
              MACHINE_DEPTH * 0.6,
              Math.round(count * 0.6),
            );
          }
        });

        if (wins.length > 1) {
          createParticles(
            0,
            REEL_PANEL_Y + 0.4,
            MACHINE_DEPTH * 0.6,
            140 + wins.length * 40,
          );
        }
      }
    } else if (!wasSpinningRef.current && anySpinning) {
      wasSpinningRef.current = true;
    }
  });

  return (
    <group>
      <SlotMachineBody
        reels={initialReels}
        onTrigger={triggerSpin}
        machineRef={machineRef}
        leverRef={leverRef}
        setReelGroupRef={setReelGroupRef}
        position={[0, 0.05, 0]}
      />

      <mesh>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial side={THREE.BackSide}>
          <GradientTexture
            stops={[0, 0.2, 1]}
            colors={["#75b048", "#c196bd", "#96a9c1"]}
            size={1024}
          />
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}

export function SlotMachineArcade({ position = [0, 5, 0], ...props }: any) {
  const staticReels = useMemo(() => {
    const baseStrip = createReelStrip();

    return Array.from({ length: REEL_COUNT }, () => {
      const offset = Math.floor(Math.random() * SYMBOLS_PER_REEL);
      const strip = rotateStrip(baseStrip, offset);

      return Array.from({ length: ROW_COUNT }, () => [...strip]);
    });
  }, []);

  return (
    <group {...props} position={position}>
      <SlotMachineBody reels={staticReels} scale={[0.6, 0.6, 0.6]} />
    </group>
  );
}
