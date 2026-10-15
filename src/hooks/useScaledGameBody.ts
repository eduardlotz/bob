import { useEffect, useRef, type RefObject } from "react";
import type { RapierRigidBody } from "@react-three/rapier";
import { GAME_ORIGIN, resizeGameMotion } from "@/utils/gameSizing";

export function useScaledGameBody(
  ref: RefObject<RapierRigidBody>,
  sizeFactor: number,
  origin = GAME_ORIGIN,
) {
  const previousSize = useRef(sizeFactor);
  useEffect(() => {
    const ratio = sizeFactor / previousSize.current;
    previousSize.current = sizeFactor;
    const body = ref.current;
    if (!body || ratio === 1) return;
    const motion = resizeGameMotion(body.translation(), body.linvel(), ratio, origin);
    body.setTranslation(motion.position, true);
    body.setLinvel(motion.velocity, true);
  }, [ref, sizeFactor, origin]);
}
