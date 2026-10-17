import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Center,
  GradientTexture,
  Line,
  Outlines,
  RoundedBox,
  Text3D,
} from "@react-three/drei";
import * as THREE from "three";
import {
  useCoreStore,
  useMiniGameStore,
  useViewStore,
  useAppStore,
} from "@/store";
import { useCursor } from "@/hooks/useCursor";
import { SlotWinLights } from "./SlotWinLights";
import {
  FloatingGameText,
  makeFloatingTextParticle,
  FLOATING_TEXT_DURATION,
  type FloatingTextKind,
  type FloatingTextParticle,
} from "./FloatingGameText";
import { useQuestActions } from "@/hooks/useQuestSystem";
import { playSound, stopSoundsById } from "@/utils/soundSystem";
import { useI18n } from "@/i18n";
import { createEmojiTexture } from "@/utils/emojiTexture";
import { FISHEYE_CONFIG } from "@/store/config/themes";
import {
  SLOT_SYMBOLS,
  SLOT_PAYOUTS,
  SPIN_COST,
  getSlotPayout,
  getWinningReels,
} from "./slotRules";

const STEP = (Math.PI * 2) / SLOT_SYMBOLS.length;
const RADIUS = 0.7;
const CELEBRATION_DURATION = 3.6;
const BUTTON_REST_Y = 1.08;
const textures = new Map<string, THREE.CanvasTexture>();

function symbolTexture(symbol: string, paper = false) {
  const key = `${symbol}-${paper}`;
  const cached = textures.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  if (paper) {
    ctx.fillStyle = "#fff7e5";
    ctx.fillRect(0, 0, 256, 256);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font =
    "160px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";
  ctx.fillText(symbol, 128, 135);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.set(key, texture);
  return texture;
}

function PrintedText({
  children,
  position = [0, 0, 0],
  size = 0.2,
  color = "#fff1c2",
  align = "center",
}: {
  children: string;
  position?: [number, number, number];
  size?: number;
  color?: string;
  align?: "center" | "right";
}) {
  if (!children) return null;
  return (
    <group position={position}>
      <Center left={align === "right"} cacheKey={children}>
        <Text3D
          font="/fonts/OpenRundeBold.json"
          size={size}
          height={0.018}
          curveSegments={4}
        >
          {children}
          <meshToonMaterial color={color} />
          {/* <Outlines screenspace thickness={0.005} color="#421f2a" /> */}
        </Text3D>
      </Center>
    </group>
  );
}

function Emoji({
  symbol,
  position,
  size = 0.3,
}: {
  symbol: string;
  position: [number, number, number];
  size?: number;
}) {
  return (
    <mesh position={position}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={symbolTexture(symbol)}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function RewardCombo({ index }: { index: number }) {
  const { locale } = useI18n();
  const options =
    index === 0
      ? SLOT_SYMBOLS
      : index < 3
        ? SLOT_SYMBOLS.slice(0, 5)
        : [SLOT_SYMBOLS[index + 2]];
  const label =
    index === 0
      ? locale === "de"
        ? "gleich"
        : "same"
      : index === 1
        ? locale === "de"
          ? "verschieden"
          : "different"
        : index === 2
          ? locale === "de"
            ? "gleich"
            : "same"
          : "";
  const stackWidth = options.length > 1 ? (index === 0 ? 0.72 : 0.4) : 0;
  const symbolSize = 0.22;
  const symbolCenter = -0.52;
  const stackStart = symbolCenter - stackWidth * 0.5;
  return (
    <group>
      <PrintedText position={[-1.15, 0, 0.06]} size={0.17}>
        {index === 0 ? "2x" : "3x"}
      </PrintedText>
      {options.map((symbol, optionIndex) => (
        <Emoji
          key={symbol}
          symbol={symbol}
          position={[
            stackStart +
              (options.length > 1
                ? (optionIndex * stackWidth) / (options.length - 1)
                : 0),
            label ? 0.045 : 0,
            0.055 + optionIndex * 0.003,
          ]}
          size={symbolSize}
        />
      ))}
      {label && (
        <PrintedText position={[symbolCenter, -0.095, 0.09]} size={0.075}>
          {label}
        </PrintedText>
      )}
    </group>
  );
}

function CabinetBox({
  position,
  size,
  color,
  highlighted = false,
  outlines = false,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  highlighted?: boolean;
  outlines?: boolean;
}) {
  return (
    <RoundedBox
      position={position}
      args={size}
      radius={0.06}
      smoothness={2}
      castShadow
      receiveShadow
    >
      <meshToonMaterial color={color} />
      {outlines && (
        <Outlines
          screenspace
          thickness={highlighted ? 0.032 : 0.018}
          color={highlighted ? "#ffd15c" : "#421f2a"}
        />
      )}
    </RoundedBox>
  );
}

function Price({
  position,
  size = 0.26,
  color = "#fff1c2",
}: {
  position: [number, number, number];
  size?: number;
  color?: string;
}) {
  const { locale } = useI18n();
  return (
    <group position={position}>
      <CabinetBox
        position={[-size * 2.7, 0, 0]}
        size={[size * 2.4, size * 0.65, 0.035]}
        color="#632531"
      />
      <PrintedText position={[-size * 2.7, 0, 0.03]} size={size * 0.42}>
        {locale === "de" ? "Preis" : "Price"}
      </PrintedText>
      <PrintedText position={[-size * 0.55, 0, 0]} size={size} color={color}>
        5K
      </PrintedText>
      <Emoji symbol="🫵" position={[size * 1.05, 0, 0.03]} size={size * 1.35} />
    </group>
  );
}

function SlotMachineBody({
  onTrigger,
  onToggleAuto,
  autoPlay = false,
  reelRefs,
  symbolRefs,
  rewardRefs,
  rowRefs,
  switchRef,
  buttonRef,
  result,
  winningReels = [],
  canSpin = true,
}: {
  onTrigger?: () => void;
  onToggleAuto?: () => void;
  autoPlay?: boolean;
  symbolRefs?: React.MutableRefObject<Array<Array<THREE.Mesh | null>>>;
  rewardRefs?: React.MutableRefObject<Array<THREE.Group | null>>;
  rowRefs?: React.MutableRefObject<Array<THREE.Group | null>>;
  switchRef?: React.Ref<THREE.Group>;
  reelRefs?: React.MutableRefObject<Array<THREE.Group | null>>;
  buttonRef?: React.Ref<THREE.Group>;
  result?: ReturnType<typeof getSlotPayout>;
  winningReels?: number[];
  canSpin?: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === "de";
  return (
    <group
      name="slot-machine"
      onPointerDown={
        onTrigger
          ? (event) => {
              event.stopPropagation();
              onTrigger();
            }
          : undefined
      }
    >
      {[-1, 1].map((side) => (
        <CabinetBox
          key={side}
          position={[side * 1.64, 3.1, 0.12]}
          size={[0.32, 6.2, 1.9]}
          color="#d23b42"
          outlines
        />
      ))}
      <CabinetBox
        position={[0, 4.65, 0.12]}
        size={[3.2, 3.1, 1.9]}
        color="#d23b42"
        outlines
      />
      <CabinetBox
        position={[0, 0.85, 0.12]}
        size={[3.2, 1.7, 1.9]}
        color="#b72c39"
        outlines
      />
      <CabinetBox
        position={[0, 2.4, -0.4]}
        size={[2.95, 1.4, 0.1]}
        color="#2d1c21"
      />
      {[1.7, 3.1].map((y) => (
        <CabinetBox
          key={y}
          position={[0, y, 1.11]}
          size={[3.04, 0.12, 0.2]}
          color="#f4c66b"
        />
      ))}
      {[-1.46, -0.48, 0.48, 1.46].map((x) => (
        <CabinetBox
          key={x}
          position={[x, 2.4, 1.1]}
          size={[0.08, 1.3, 0.18]}
          color="#f4c66b"
        />
      ))}
      {[0, 1, 2].map((reel) => (
        <group key={reel} position={[(reel - 1) * 0.96, 2.4, 0.36]}>
          <group
            ref={(node) => {
              if (reelRefs) reelRefs.current[reel] = node;
            }}
            rotation={[reel * STEP, 0, 0]}
          >
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry
                args={[RADIUS - 0.03, RADIUS - 0.03, 0.86, 32]}
              />
              <meshToonMaterial color="#fff7e5" />
            </mesh>
            {SLOT_SYMBOLS.map((symbol, index) => {
              const theta = index * STEP;
              return (
                <mesh
                  key={symbol}
                  ref={(mesh) => {
                    if (symbolRefs) {
                      symbolRefs.current[reel] ??= [];
                      symbolRefs.current[reel][index] = mesh;
                    }
                  }}
                  position={[
                    0,
                    Math.sin(theta) * RADIUS,
                    Math.cos(theta) * RADIUS,
                  ]}
                  rotation={[-theta, 0, 0]}
                >
                  <planeGeometry args={[0.84, 0.57]} />
                  <meshBasicMaterial
                    map={symbolTexture(symbol, true)}
                    toneMapped={false}
                  />
                </mesh>
              );
            })}
          </group>
        </group>
      ))}
      <CabinetBox
        position={[0, 4.8, 1.1]}
        size={[2.96, 2.55, 0.12]}
        color="#632531"
        outlines
      />
      <PrintedText position={[0, 5.9, 1.2]} size={0.23}>
        {de ? "Gewinne" : "Rewards"}
      </PrintedText>
      {SLOT_PAYOUTS.map((payout, i) => (
        <group
          key={payout.id}
          position={[0, 5.55 - i * 0.32, 1.23]}
          name={`slot-reward-${payout.id}`}
          ref={(group) => {
            if (rewardRefs) rewardRefs.current[i] = group;
          }}
        >
          <CabinetBox
            position={[0, 0, -0.025]}
            size={[2.65, 0.29, 0.045]}
            color="#632531"
            highlighted={result?.id === payout.id}
            outlines={result?.id === payout.id}
          />
          <RewardCombo index={i} />
          <PrintedText position={[0.94, 0, 0.04]} size={0.22} align="right">
            {payout.taps >= 1_000_000
              ? `${payout.taps / 1_000_000}M`
              : `${payout.taps / 1000}K`}
          </PrintedText>
          <Emoji symbol="🫵" position={[1.16, 0, 0.05]} size={0.25} />
        </group>
      ))}
      <Price position={[0, 3.55, 1.21]} size={0.38} />
      {/* The opening is functional: winnings shoot out here, toward the player. */}
      <CabinetBox
        position={[-0.55, 0.86, 1.1]}
        size={[1.32, 0.25, 0.12]}
        color="#2d1c21"
      />
      <CabinetBox
        position={[0, 0.275, 1.95]}
        size={[2.2, 0.55, 1.8]}
        color="#792332"
        outlines
      />
      <mesh position={[0, 0.65, 1.95]}>
        <cylinderGeometry args={[0.79, 0.84, 0.2, 40]} />
        <meshToonMaterial color="#f4c66b" />
        <Outlines screenspace thickness={0.018} color="#421f2a" />
      </mesh>
      <group
        ref={buttonRef}
        position={[0, BUTTON_REST_Y, 1.95]}
        name="slot-play-button"
      >
        <mesh>
          <cylinderGeometry args={[0.66, 0.7, 0.65, 40]} />
          <meshToonMaterial color={canSpin ? "#ef3c46" : "#94333b"} />
          <Outlines screenspace thickness={0.022} color="#421f2a" />
        </mesh>
        <group position={[0, 0.333, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <PrintedText size={0.24} color="#fff1c2">
            {de ? "Spielen" : "Play"}
          </PrintedText>
        </group>
      </group>
      <group
        name="slot-autoplay-switch"
        onPointerDown={
          onToggleAuto
            ? (event) => {
                event.stopPropagation();
                onToggleAuto();
              }
            : undefined
        }
      >
        <CabinetBox
          position={[1.5, 0.275, 1.95]}
          size={[0.68, 0.55, 0.85]}
          color="#792332"
          outlines
        />
        <mesh position={[1.5, 0.59, 1.95]}>
          <cylinderGeometry args={[0.2, 0.24, 0.1, 16]} />
          <meshToonMaterial color="#f4c66b" />
          <Outlines screenspace thickness={0.018} color="#421f2a" />
        </mesh>
        <group
          ref={switchRef}
          position={[1.5, 0.64, 1.95]}
          rotation={[autoPlay ? -0.4 : 0.4, 0, 0]}
        >
          <mesh position={[0, 0.23, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.46, 10]} />
            <meshToonMaterial color="#f4c66b" />
          </mesh>
          <mesh position={[0, 0.49, 0]}>
            <sphereGeometry args={[0.13, 12, 8]} />
            <meshToonMaterial color={autoPlay ? "#77e5a5" : "#ef3c46"} />
            <Outlines screenspace thickness={0.018} color="#421f2a" />
          </mesh>
        </group>
        <PrintedText position={[1.5, 0.34, 2.39]} size={0.14}>
          Auto
        </PrintedText>
      </group>
      {result &&
        winningReels.map((i) => (
          <group
            key={i}
            position={[(i - 1) * 0.96, 2.4, 1.14]}
            name="slot-winning-row-outline"
            ref={(group) => {
              if (rowRefs) rowRefs.current[i] = group;
            }}
          >
            <Line
              points={[
                [-0.43, -0.3, 0],
                [0.43, -0.3, 0],
                [0.43, 0.3, 0],
                [-0.43, 0.3, 0],
                [-0.43, -0.3, 0],
              ]}
              color="#ffd15c"
              lineWidth={2.5}
            />
          </group>
        ))}
    </group>
  );
}

function TapBurst({ age }: { age: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const texture = useMemo(() => createEmojiTexture("🫵"), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  const coins = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        delay: i * 0.04,
        x: Math.sin(i * 2.4) * 2.3,
        y: 3.8 + (i % 5) * 0.3,
        z: 2.2 + (i % 4) * 0.45,
      })),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    ref.current.visible =
      age.current >= 0 && age.current < CELEBRATION_DURATION;
    coins.forEach((coin, i) => {
      const t = age.current - coin.delay;
      const visible = t >= 0 && t < 1.9;
      dummy.position.set(
        -0.55 + coin.x * Math.max(t, 0),
        0.86 + coin.y * Math.max(t, 0) - 4.9 * t * t,
        1.2 + coin.z * Math.max(t, 0),
      );
      dummy.rotation.set(t * 7 + i, 0, t * 4);
      dummy.scale.setScalar(visible ? 0.45 * Math.min(1, (1.9 - t) * 3) : 0);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, coins.length]}
      frustumCulled={false}
      name="slot-tap-burst"
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        alphaTest={0.1}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

type Reel = {
  angle: number;
  from: number;
  to: number;
  elapsed: number;
  duration: number;
  result: number;
  stopped: boolean;
};

export function SlotMachineGame({ onExit: _onExit }: { onExit: () => void }) {
  const { locale, formatNumber } = useI18n();
  const taps = useCoreStore((state) => state.taps);
  const isMobile = useAppStore((state) => state.isMobile);
  const cameraControlsRef = useViewStore((state) => state.cameraControlsRef);
  const { size } = useThree();
  const mobile = isMobile || size.width < 768;
  const cursor = useCursor({ condition: () => !mobile, positionFactor: 1 });
  const { triggerQuest } = useQuestActions();
  const [result, setResult] = useState<
    ReturnType<typeof getSlotPayout> | undefined
  >();
  const [autoPlay, setAutoPlay] = useState(false);
  const [textParticles, setTextParticles] = useState<FloatingTextParticle[]>(
    [],
  );
  const nextTextId = useRef(0);
  const running = useRef(false);
  const auto = useRef(false);
  const cooldown = useRef(0);
  const winning = useRef<number[]>([]);
  const pop = useRef(0);
  const reelRefs = useRef<Array<THREE.Group | null>>([]);
  const symbolRefs = useRef<Array<Array<THREE.Mesh | null>>>([]);
  const rewardRefs = useRef<Array<THREE.Group | null>>([]);
  const rowRefs = useRef<Array<THREE.Group | null>>([]);
  const buttonRef = useRef<THREE.Group>(null);
  const switchRef = useRef<THREE.Group>(null);
  const backdrop = useRef<THREE.MeshBasicMaterial>(null);
  const time = useRef(10);
  const celebration = useRef(-1);
  const winDuration = useRef(3);
  const reels = useRef<Reel[]>(
    [0, 1, 2].map((i) => ({
      angle: i * STEP,
      from: 0,
      to: 0,
      elapsed: 0,
      duration: 0,
      result: i,
      stopped: true,
    })),
  );

  const emitText = useCallback((text: string, kind: FloatingTextKind) => {
    const particle = makeFloatingTextParticle(nextTextId.current++, text, kind);
    setTextParticles((current) => [...current.slice(-5), particle]);
  }, []);
  const removeText = useCallback(
    (id: number) =>
      setTextParticles((current) =>
        current.filter((particle) => particle.id !== id),
      ),
    [],
  );
  const stopAuto = useCallback(() => {
    auto.current = false;
    setAutoPlay(false);
  }, []);

  const spin = useCallback(() => {
    if (running.current) return;
    if (!useCoreStore.getState().spendTaps(SPIN_COST)) {
      stopAuto();
      emitText(
        locale === "de" ? "Nicht genug Taps" : "Not enough taps",
        "muted",
      );
      return;
    }
    running.current = true;
    cooldown.current = 0;
    setResult(undefined);
    winning.current = [];
    celebration.current = -1;
    time.current = 0;
    emitText("−5K 🫵", "cost");
    reels.current.forEach((reel, i) => {
      reel.result = Math.floor(Math.random() * SLOT_SYMBOLS.length);
      reel.from = reel.angle;
      const wholeTurn = Math.ceil(reel.angle / (Math.PI * 2));
      reel.to = (wholeTurn + 4 + i) * Math.PI * 2 + reel.result * STEP;
      reel.elapsed = 0;
      reel.duration = 2.1 + i * 0.45;
      reel.stopped = false;
    });
    playSound("slot-spin");
    triggerQuest("minigames_slot_spin");
  }, [emitText, locale, stopAuto, triggerQuest]);

  const handleTrigger = useCallback(() => {
    if (auto.current) {
      stopAuto();
      return;
    }
    spin();
  }, [spin, stopAuto]);
  const toggleAuto = useCallback(() => {
    if (auto.current) {
      stopAuto();
      return;
    }
    if (useCoreStore.getState().taps < SPIN_COST) {
      emitText(
        locale === "de" ? "Nicht genug Taps" : "Not enough taps",
        "muted",
      );
      return;
    }
    auto.current = true;
    setAutoPlay(true);
    spin();
  }, [emitText, locale, spin, stopAuto]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.repeat ||
        (event.target as HTMLElement)?.closest(
          "input,textarea,button,[contenteditable=true]",
        )
      )
        return;
      event.preventDefault();
      handleTrigger();
    };
    const onVisibility = () => {
      if (document.hidden) stopSoundsById("slot-spin");
      else if (running.current) playSound("slot-spin");
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      ["slot-spin", "slot-stop", "slot-win"].forEach(stopSoundsById);
    };
  }, [handleTrigger, stopAuto]);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    // Match the UI particle lifetimes even when rendering runs below 20 FPS.
    const elapsed = document.hidden ? 0 : rawDelta;
    time.current += elapsed;
    cooldown.current = Math.max(0, cooldown.current - elapsed);
    const { fisheyeEnabled } = useCoreStore.getState().graphicPreferences;
    const diameter = Math.hypot(size.width, size.height) * (1 + FISHEYE_CONFIG.MIN);
    const projectAngle = fisheyeEnabled ? Math.asin : Math.atan;
    const horizontalAngle = 2 * projectAngle((size.width * 0.78) / diameter);
    const verticalAngle = 2 * projectAngle((size.height * 0.74) / diameter);
    const distance =
      Math.max(
        1.9 / Math.tan(horizontalAngle),
        3.35 / Math.tan(verticalAngle),
      ) + 1.5;
    const view = useViewStore.getState();
    const cameraView = view.getCurrentViewConfig();
    const follow = cameraView?.cursorFollow;
    const followX = mobile
      ? 0
      : cursor.current.x * (follow?.strength ?? 2.3) +
        Math.sin(clock.elapsedTime) * (follow?.swayX ?? 0.03);
    const followY = mobile
      ? 0
      : cursor.current.y * (follow?.strength ?? 2.3) * (follow?.yScale ?? 0.4) +
        Math.sin(clock.elapsedTime * 0.5) * (follow?.swayY ?? 0.02);
    if (
      cameraView?.id === "minigames:slot_machine" &&
      view.viewMode === "fixed" &&
      !view.isTransitioning
    ) {
      cameraControlsRef?.current?.setLookAt(
        0,
        4.25,
        distance,
        followX,
        3.1 + followY,
        0,
        true,
      );
    }
    reels.current.forEach((reel, i) => {
      if (!reel.stopped) {
        reel.elapsed = Math.min(reel.duration, reel.elapsed + elapsed);
        const t = reel.elapsed / reel.duration;
        reel.angle = THREE.MathUtils.lerp(reel.from, reel.to, 1 - (1 - t) ** 3);
        if (t === 1) {
          reel.angle = reel.result * STEP;
          reel.stopped = true;
          playSound("slot-stop");
        }
      }
      const group = reelRefs.current[i];
      if (group) group.rotation.x = reel.angle;
    });
    if (buttonRef.current) {
      const t = time.current;
      const release = t - 0.055;
      const bounce =
        t < 0.055
          ? -0.23 * (1 - (1 - t / 0.055) ** 3)
          : release < 0.65
            ? -0.23 * Math.exp(-9 * release) * Math.cos(25 * release)
            : 0;
      buttonRef.current.position.y = auto.current
        ? BUTTON_REST_Y - 0.43
        : THREE.MathUtils.damp(
            buttonRef.current.position.y,
            BUTTON_REST_Y + bounce,
            t < 0.7 ? 65 : 18,
            delta,
          );
    }
    if (switchRef.current)
      switchRef.current.rotation.x = THREE.MathUtils.damp(
        switchRef.current.rotation.x,
        auto.current ? -0.4 : 0.4,
        14,
        delta,
      );
    if (running.current && reels.current.every((reel) => reel.stopped)) {
      running.current = false;
      stopSoundsById("slot-spin");
      const symbols = reels.current.map((reel) => reel.result);
      const win = getSlotPayout(symbols);
      setResult(win);
      winning.current = getWinningReels(symbols);
      if (win) {
        const games = useMiniGameStore.getState();
        for (let i = 0; i < win.points; i++) games.incrementScore();
        useCoreStore.getState().addTaps(win.taps);
        triggerQuest("minigames_slot_win");
        playSound("slot-win");
        celebration.current = 0;
        const kind = win.taps >= 1_000_000 ? "gold" : "win";
        winDuration.current = FLOATING_TEXT_DURATION[kind];
        cooldown.current = winDuration.current + 0.25;
        emitText(`+${formatNumber(win.taps)} 🫵`, kind);
      } else {
        cooldown.current = 0.25;
      }
    }
    if (celebration.current >= 0) celebration.current += elapsed;
    pop.current = THREE.MathUtils.damp(
      pop.current,
      winning.current.length ? 0.32 : 0,
      12,
      delta,
    );
    symbolRefs.current.forEach((symbols, reelIndex) =>
      symbols?.forEach((mesh, index) => {
        if (!mesh) return;
        const theta = index * STEP;
        const radius =
          RADIUS +
          (winning.current.includes(reelIndex) &&
          index === reels.current[reelIndex].result
            ? pop.current
            : 0);
        mesh.position.set(
          0,
          Math.sin(theta) * radius,
          Math.cos(theta) * radius,
        );
      }),
    );
    rowRefs.current.forEach((group) => {
      if (group) group.position.z = 1.14 + pop.current;
    });
    rewardRefs.current.forEach((group, i) => {
      if (group)
        group.position.z = THREE.MathUtils.damp(
          group.position.z,
          result?.id === SLOT_PAYOUTS[i].id ? 1.5 : 1.23,
          12,
          delta,
        );
    });
    if (
      auto.current &&
      !running.current &&
      cooldown.current === 0 &&
      !document.hidden
    )
      spin();
  });

  return (
    <group>
      <SlotMachineBody
        onTrigger={handleTrigger}
        onToggleAuto={toggleAuto}
        autoPlay={autoPlay}
        reelRefs={reelRefs}
        symbolRefs={symbolRefs}
        rewardRefs={rewardRefs}
        rowRefs={rowRefs}
        switchRef={switchRef}
        buttonRef={buttonRef}
        result={result}
        winningReels={winning.current}
        canSpin={taps >= SPIN_COST}
      />
      <TapBurst age={celebration} />
      <SlotWinLights
        age={celebration}
        duration={winDuration}
        backdrop={backdrop}
      />
      <FloatingGameText particles={textParticles} onComplete={removeText} />
      <mesh>
        <sphereGeometry args={[100, 16, 16]} />
        <meshBasicMaterial ref={backdrop} side={THREE.BackSide}>
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
  return (
    <group {...props} position={position}>
      <group scale={0.48}>
        <SlotMachineBody />
      </group>
    </group>
  );
}
