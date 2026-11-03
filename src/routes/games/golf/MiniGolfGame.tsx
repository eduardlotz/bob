import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Billboard } from '@react-three/drei';
import CameraControls from 'camera-controls';
import { useFrame, useThree } from '@react-three/fiber';
import { BallCollider, RigidBody, useBeforePhysicsStep, useRapier, type RapierRigidBody } from '@react-three/rapier';
import * as T from 'three';
import { useCoreStore, useMiniGameStore, useViewStore } from '@/store';
import { PointsCounter } from '@/molecules/PointsCounter';
import { CharacterBallModel } from '@/components/CharacterBall';
import { playSound } from '@/utils/soundSystem';
import { DEFAULT_PING_PONG_HIT_SOUND, DEFAULT_TAP_SOUND } from '@/utils/sound/defaults';
import { GolfTile, GolfModel } from './GolfModels';
import { GolfGarden } from './GolfGarden';
import { GolfAim, type GolfAimState } from './GolfAim';
import { GolfOverlay, type GolfPhase as Phase } from './GolfOverlay';
import { getSceneLensRadius } from '@/utils/sceneLensFraming';
import { useBobEditor } from '@/store/bobEditor';
import { useScreenTransition } from '@/store/screenTransition';
import { golfPointerRay, hitsGolfBob, golfDragBasis, golfShotFromDrag } from './golfInput';
import { setGolfFollowView } from './golfCamera';
import { BALL_RADIUS, COURSE_Y, GOLF_COURSES, TILE_SIZE, TURF_HEIGHT, MIN_SHOT_POWER, isOutsideCourse, ballNeedsReset, canSink, goalPosition, isRough, type Course } from './courses';

export function MiniGolfGame({ onExit: _onExit }: { onExit: () => void }) {
  const [hole, setHole] = useState(0);
  const [strokes, setStrokes] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const best = useMiniGameStore(s => s.bestGolfScore);
  const total = scores.slice(0, hole).reduce((sum, n) => sum + n, 0) + strokes;
  const finishHole = useCallback((score: number) => {
    const next = [...scores.slice(0, hole), score];
    setScores(next);
    if (hole === GOLF_COURSES.length - 1) {
      useMiniGameStore.getState().recordGolfRound(next.reduce((sum, n) => sum + n, 0));
      setPhase('complete');
    } else setPhase('sunk');
  }, [scores, hole]);
  const addStroke = useCallback(() => setStrokes(s => s + 1), []);
  const next = () => { setHole(h => h + 1); setStrokes(0); setPhase('ready'); };
  const replay = () => {
    setHole(0); setStrokes(0); setScores([]); setPhase('ready'); setRound(r => r + 1);
  };
  // A new key resets the physics body, aim and last safe position for every hole/replay.
  const [round, setRound] = useState(0);
  return <GolfRound key={`${round}:${hole}`} course={GOLF_COURSES[hole]} hole={hole} strokes={strokes} total={total}
    phase={phase} best={best} setPhase={setPhase} onStroke={addStroke} onSink={finishHole}
    onNext={next} onReplay={replay} />;
}
function GolfRound({ course, hole, strokes, total, phase, best, setPhase, onStroke, onSink, onNext, onReplay }: {
  course: Course; hole: number; strokes: number; total: number; phase: Phase; best: number | null;
  setPhase: (phase: Phase) => void; onStroke: () => void; onSink: (score: number) => void; onNext: () => void; onReplay: () => void;
}) {
  const { camera, gl, size } = useThree();
  const controlsRef = useViewStore(s => s.cameraControlsRef);
  const transitioning = useViewStore(s => s.isTransitioning);
  const paused = useCoreStore(s => s.isPaused);
  const { world, rapier } = useRapier();
  const ball = useRef<RapierRigidBody>(null);
  const aim = useRef<GolfAimState | null>(null);
  const state = useRef({ phase, strokes, paused });
  state.current = { phase, strokes, paused };
  const start = useMemo(() => new T.Vector3(0, COURSE_Y + TURF_HEIGHT + BALL_RADIUS + .006, 0), []);
  const safe = useRef(start.clone());
  const rest = useRef(0), impactAt = useRef(0);
  const goal = useMemo(() => goalPosition(course), [course]);
  const [penalty, setPenalty] = useState(false);
  const penaltyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const following = useRef(true);
  const direction = useRef(new T.Vector3(0, 0, -1));
  const look = useMemo(() => new T.Vector3(), []);
  useEffect(() => {
    const controls = controlsRef?.current;
    if (!controls || transitioning) return;
    const saved = { enabled: controls.enabled, minDistance: controls.minDistance, maxDistance: controls.maxDistance,
      minPolarAngle: controls.minPolarAngle, maxPolarAngle: controls.maxPolarAngle,
      minAzimuthAngle: controls.minAzimuthAngle, maxAzimuthAngle: controls.maxAzimuthAngle,
      mouseButtons: { ...controls.mouseButtons }, touches: { ...controls.touches } };
    const savedOffset = controls.getFocalOffset(new T.Vector3());
    controls.enabled = false;
    controls.minDistance = 1;
    controls.maxDistance = 30;
    const { ACTION } = CameraControls;
    Object.assign(controls.mouseButtons, { left: ACTION.ROTATE, right: ACTION.TRUCK, middle: ACTION.DOLLY, wheel: ACTION.DOLLY });
    Object.assign(controls.touches, { one: ACTION.TOUCH_ROTATE, two: ACTION.TOUCH_DOLLY_TRUCK });
    const distance = size.width < 600 ? .43 : .27;
    controls.setFocalOffset(0, 0, 0, false);
    controls.setLookAt(start.x, start.y + distance * .4, start.z + distance, start.x, start.y + .015, start.z - .75, false);
    following.current = true;
    return () => {
      controls.cancel();
      const { mouseButtons, touches, ...settings } = saved;
      controls.setFocalOffset(savedOffset.x, savedOffset.y, savedOffset.z, false);
      Object.assign(controls, settings);
      Object.assign(controls.mouseButtons, mouseButtons); Object.assign(controls.touches, touches);
    };
  }, [controlsRef, transitioning, start]);
  useEffect(() => () => clearTimeout(penaltyTimer.current), []);
  const cancelAim = useCallback(() => {
    const drag = aim.current;
    aim.current = null;
    if (drag && controlsRef?.current) controlsRef.current.enabled = !following.current && !state.current.paused;
    if (drag && gl.domElement.hasPointerCapture(drag.pointer)) gl.domElement.releasePointerCapture(drag.pointer);
  }, [gl, controlsRef]);
  const startPlaying = useCallback(() => {
    if (useScreenTransition.getState().phase !== 'idle') return;
    state.current.phase = 'ready'; setPhase('ready');
  }, [setPhase]);
  useEffect(() => {
    if (paused) cancelAim();
    if (controlsRef?.current && !transitioning) controlsRef.current.enabled = !paused && !aim.current && !following.current;
  }, [paused, cancelAim, controlsRef, transitioning]);
  useEffect(() => {
    const canvas = gl.domElement;
    const oldTouch = canvas.style.touchAction;
    const oldCursor = canvas.style.cursor;
    const pointers = new Map<number, PointerEvent>();
    let replayingPointer = false;
    canvas.style.touchAction = 'none';
    const freeCamera = () => {
      const controls = controlsRef?.current, p = ball.current?.translation();
      if (state.current.paused || aim.current) return;
      if (following.current && controls && p) {
        controls.stop(); controls.update(0);
        controls.minDistance = .2;
        controls.minPolarAngle = .05;
        controls.maxPolarAngle = Math.PI / 2 - .05;
        controls.setOrbitPoint(p.x, p.y, p.z);
      }
      following.current = false;
      if (controls) controls.enabled = true;
    };
    const hitBob = (event: PointerEvent) => {
      if (!ball.current) return false;
      const rect = canvas.getBoundingClientRect();
      const offset = useBobEditor.getState().screenOffset;
      const fisheye = useCoreStore.getState().graphicPreferences.fisheyeEnabled;
      const radius = fisheye ? getSceneLensRadius(rect.width, rect.height, offset) : null;
      return hitsGolfBob(golfPointerRay(camera, event.clientX - rect.left + (fisheye ? offset.x : 0),
        event.clientY - rect.top + (fisheye ? offset.y : 0), rect.width, rect.height, radius), new T.Vector3().copy(ball.current.translation()));
    };
    const down = (event: PointerEvent) => {
      if (replayingPointer) return;
      if (state.current.paused || document.hidden || transitioning) return;
      pointers.set(event.pointerId, event);
      // A second finger cancels a pending putt and becomes a camera gesture.
      if (pointers.size > 1) {
        const first = aim.current && pointers.get(aim.current.pointer);
        cancelAim();
        freeCamera();
        if (first) {
          // The original Bob grab never reached CameraControls. Hand it over
          // now so both fingers participate in pan/pinch from this point on.
          const current = pointers.get(first.pointerId)!;
          replayingPointer = true;
          try { canvas.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true, pointerId: current.pointerId, pointerType: current.pointerType,
            clientX: current.clientX, clientY: current.clientY, button: 0, buttons: 1,
          })); } finally { replayingPointer = false; }
        }
        return;
      }
      if (event.button === 0 && state.current.phase === 'idle' && !state.current.paused) {
        event.stopImmediatePropagation(); startPlaying(); return;
      }
      if (state.current.paused || document.hidden || transitioning || useScreenTransition.getState().phase !== 'idle') return;
      if (aim.current) return;
      if (event.button !== 0 || state.current.phase !== 'ready' || !hitBob(event)) { freeCamera(); return; }
      // Run before CameraControls so this gesture exclusively belongs to Bob.
      event.stopImmediatePropagation(); event.preventDefault();
      const { right, forward } = golfDragBasis(camera);
      const rect = canvas.getBoundingClientRect();
      aim.current = { pointer: event.pointerId, start: new T.Vector2(event.clientX, event.clientY), right, forward,
        maxPixels: Math.max(80, Math.min(rect.width, rect.height) * .28), x: 0, z: 0, power: 0 };
      if (controlsRef?.current) { controlsRef.current.stop(); controlsRef.current.enabled = false; }
      canvas.style.touchAction = 'none';
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, event);
      const drag = aim.current;
      canvas.style.cursor = drag ? 'grabbing' : state.current.phase === 'ready' && hitBob(event) ? 'grab' : oldCursor;
      if (!drag || drag.pointer !== event.pointerId) return;
      const shot = golfShotFromDrag(event.clientX - drag.start.x, event.clientY - drag.start.y, drag.right, drag.forward, drag.maxPixels);
      Object.assign(drag, shot);
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      const drag = aim.current;
      if (!drag || drag.pointer !== event.pointerId) return;
      move(event);
      const shot = { ...drag };
      cancelAim();
      if (shot.power < MIN_SHOT_POWER || state.current.paused || state.current.phase !== 'ready' || !ball.current) return;
      if (isOutsideCourse(course, ball.current.translation())) return;
      safe.current.copy(ball.current.translation());
      ball.current.setLinvel({ x: shot.x, y: 0, z: shot.z }, true);
      ball.current.setAngvel({ x: shot.z / BALL_RADIUS, y: 0, z: -shot.x / BALL_RADIUS }, true);
      rest.current = 0;
      state.current.phase = 'rolling';
      following.current = true;
      const controls = controlsRef?.current;
      if (controls) {
        controls.enabled = false;
        controls.minDistance = 1;
        controls.setFocalOffset(0, 0, 0, false);
        // Return straight to the original follow pose without interpolating
        // from an orbit point or carrying its framing offset into the shot.
        setGolfFollowView(controls, ball.current.translation(), goal, direction.current, size.width, true, false);
      }
      onStroke(); setPhase('rolling'); setPenalty(false);
      playSound(DEFAULT_PING_PONG_HIT_SOUND.id, { volume: .25 + shot.power * .5 });
    };
    const cancel = (event: PointerEvent) => { pointers.delete(event.pointerId); if (event.pointerId === aim.current?.pointer) cancelAim(); };
    const lostCapture = (event: PointerEvent) => { if (event.pointerId === aim.current?.pointer) cancelAim(); };
    const blur = () => { pointers.clear(); cancelAim(); controlsRef?.current?.cancel(); };
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Escape' && aim.current) { event.preventDefault(); cancelAim(); return; }
      if (event.code !== 'Space' || event.repeat || state.current.phase !== 'idle' || state.current.paused ||
        (event.target as HTMLElement | null)?.closest('button,input,textarea,[contenteditable=true]')) return;
      event.preventDefault(); startPlaying();
    };
    canvas.addEventListener('pointerdown', down, true);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', lostCapture);
    canvas.addEventListener('wheel', freeCamera, { passive: true, capture: true });
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', key);
    document.addEventListener('visibilitychange', blur);
    return () => {
      cancelAim(); canvas.style.touchAction = oldTouch; canvas.style.cursor = oldCursor;
      canvas.removeEventListener('pointerdown', down, true); canvas.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', lostCapture); window.removeEventListener('blur', blur);
      canvas.removeEventListener('wheel', freeCamera, true);
      document.removeEventListener('visibilitychange', blur); window.removeEventListener('keydown', key);
    };
  }, [camera, gl, cancelAim, onStroke, setPhase, startPlaying, course, controlsRef, transitioning, size.width, goal]);

  const suspended = useRef<{ linear: T.Vector3; angular: T.Vector3 } | null>(null);
  useBeforePhysicsStep(() => {
    const body = ball.current;
    if (!body) return;
    if (state.current.paused || document.hidden) {
      if (!suspended.current) suspended.current = { linear: new T.Vector3().copy(body.linvel()), angular: new T.Vector3().copy(body.angvel()) };
      body.setLinvel({ x: 0, y: 0, z: 0 }, false); body.setAngvel({ x: 0, y: 0, z: 0 }, false);
      body.setGravityScale(0, false);
      return;
    }
    if (suspended.current) {
      body.setLinvel(suspended.current.linear, true); body.setAngvel(suspended.current.angular, true);
      body.setGravityScale(state.current.phase === 'rolling' ? 1 : 0, true); suspended.current = null;
    }
    if (state.current.phase !== 'rolling') return;
    const p = body.translation(), v = body.linvel();
    const contact = world.castRay(new rapier.Ray(p, { x: 0, y: -1, z: 0 }), BALL_RADIUS + .025, true, undefined, undefined, undefined, body);
    if (!contact) return;
    const speed = Math.hypot(v.x, v.z);
    const deceleration = isRough(course, p.x, p.z) ? 2.4 : .52;
    const factor = speed > 0 ? Math.max(0, 1 - deceleration * world.timestep / speed) : 0;
    body.setLinvel({ x: v.x * factor, y: v.y, z: v.z * factor }, true);
  });
  useFrame((_, rawDelta) => {
    const body = ball.current;
    if (!body) return;
    const p = body.translation();
    const delta = Math.min(rawDelta, .05);
    if (state.current.paused || document.hidden) return;
    if (phase === 'ready' || phase === 'rolling') {
      const v = body.linvel();
      if (ballNeedsReset(course, p, safe.current, v.y, phase === 'ready' || rest.current > .2)) {
        cancelAim();
        body.setTranslation(safe.current, true); body.setLinvel({ x: 0, y: 0, z: 0 }, true); body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rest.current = 0; onStroke(); state.current.phase = 'ready'; setPhase('ready'); setPenalty(true);
        clearTimeout(penaltyTimer.current); penaltyTimer.current = setTimeout(() => setPenalty(false), 2800);
        return;
      }
    }
    if (phase === 'ready') {
      body.setLinvel({ x: 0, y: 0, z: 0 }, false);
      body.setAngvel({ x: 0, y: 0, z: 0 }, false);
    }
    if (phase === 'rolling') {
      const v = body.linvel(), speed = Math.hypot(v.x, v.y, v.z);
      if (canSink(p, speed, goal)) {
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        body.setTranslation({ x: goal[0], y: goal[1] - .04, z: goal[2] }, true);
        state.current.phase = 'sunk';
        onSink(strokes);
        playSound(DEFAULT_TAP_SOUND.id, { volume: .6 });
      } else {
        rest.current = speed < .012 ? rest.current + delta : 0;
        if (rest.current > .45) { state.current.phase = 'ready'; setPhase('ready'); }
      }
    }
    const controls = controlsRef?.current;
    if (controls && following.current && !aim.current && !transitioning && !useViewStore.getState().loadingCameraActive) {
      look.set(goal[0] - p.x, 0, goal[2] - p.z);
      if (look.length() > .4) direction.current.lerp(look.normalize(), 1 - Math.exp(-delta * 3)).normalize();
      setGolfFollowView(controls, p, goal, direction.current, size.width, phase === 'rolling');
    }
  });
  const hit = () => {
    if (state.current.phase !== 'rolling' || performance.now() - impactAt.current < 140) return;
    impactAt.current = performance.now(); playSound(DEFAULT_PING_PONG_HIT_SOUND.id, { volume: .15 });
  };
  return <group name="mini-golf">
    <group userData={{ foregroundOutline: false }}><GolfGarden course={course} /></group>
    {course.tiles.map((tile, i) => <GolfTile key={i} tile={tile} />)}
    <group position={goal}><GolfModel asset="flag-red" scale={TILE_SIZE * .65} /></group>
    <Billboard position={[goal[0], -1.5 + .42 + .015, goal[2] - 2.5]} follow>
      <group scale={.42}><group position={[0, 0, 6]}><PointsCounter number={strokes} counterColor={penalty ? "#ef6b58" : "white"} /></group></group>
    </Billboard>
    <RigidBody ref={ball} colliders={false} position={start.toArray()} ccd linearDamping={.12} angularDamping={.5}
      enabledRotations={[true, true, true]} gravityScale={phase === 'idle' || phase === 'ready' || phase === 'sunk' || phase === 'complete' || paused ? 0 : 1} canSleep={false}>
      <BallCollider args={[BALL_RADIUS]} restitution={.4} friction={.45} mass={.045} onCollisionEnter={hit} />
      <CharacterBallModel scale={BALL_RADIUS} transitionTarget />
    </RigidBody>
    <GolfAim ball={ball} aim={aim} />
    <GolfOverlay hole={hole} strokes={strokes} total={total} phase={phase} penalty={penalty} best={best} onNext={onNext} onReplay={onReplay} />
  </group>;
}
