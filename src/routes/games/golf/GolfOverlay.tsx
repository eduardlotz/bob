import { AnimatePresence, useReducedMotion } from 'motion/react';
import styled from 'styled-components';
import { useI18n } from '@/i18n';
import { useAppStore } from '@/store';
import { PANEL_SPRING } from '@/styles/panelMotion';
import { GameOverlay } from '../GameOverlay';
import { GameScreenBackdrop, GameScores, GameScore, GameScoreLabel } from '../GameScreenStyles';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { GolfInstructions } from './GolfInstructions';
export type GolfPhase = 'idle' | 'ready' | 'rolling' | 'sunk' | 'complete';
export function GolfOverlay({ hole, strokes, total, phase, penalty, best, onNext, onReplay }: {
  hole: number; strokes: number; total: number; phase: GolfPhase; penalty: boolean;
  best: number | null; onNext: () => void; onReplay: () => void;
}) {
  const { locale } = useI18n();
  const mobile = useAppStore(s => s.isMobile);
  const de = locale === 'de';
  const reduced = useReducedMotion();
  const pop = (rotation: number, delay = 0) => ({
    initial: { scale: reduced ? 1 : .5, rotate: reduced ? 0 : rotation - 12, opacity: 0 },
    animate: { scale: 1, rotate: reduced ? 0 : rotation, opacity: 1 },
    exit: { scale: reduced ? 1 : .5, opacity: 0 }, transition: { ...PANEL_SPRING, delay },
  });
  return <GameOverlay>
    {(phase === 'ready' || phase === 'rolling') && <LevelCounter className="highscore" aria-label={`Level ${hole + 1} / 10`}>
      <strong key={hole}>{hole + 1}<small> / 10</small></strong>
    </LevelCounter>}
    <LiveStatus role="status" aria-live="polite">{penalty ? (de ? 'Wasser oder Aus. Ein Strafschlag.' : 'Water or out of bounds. One penalty stroke.') : ''}</LiveStatus>
    <AnimatePresence>
      {(phase === 'idle' || phase === 'sunk' || phase === 'complete') && <GameScreenBackdrop key={phase}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .3 }}>
        {phase === 'idle' ? <GolfInstructions de={de} mobile={mobile} /> : <GameScores role="status" aria-live="polite">
          <GameScore {...pop(-6)}>
            <strong>{phase === 'complete' ? total : strokes}</strong>
            <GameScoreLabel>{phase === 'complete' ? (de ? 'Gesamtschläge' : 'total strokes') : (de ? `Level ${hole + 1} geschafft` : `Level ${hole + 1} complete`)}</GameScoreLabel>
          </GameScore>
          {phase === 'complete' && best !== null && <GameScore className="highscore" {...pop(6, .08)}>
            <strong>{best}</strong><GameScoreLabel>{de ? 'Beste Runde' : 'Best round'}</GameScoreLabel>
          </GameScore>}
          <Advance $variant="blue" type="button" {...pop(0, .12)} onClick={phase === 'complete' ? onReplay : onNext}>
            {phase === 'complete' ? (de ? 'Nochmal spielen' : 'Replay') : (de ? 'Nächstes Level' : 'Next level')}
          </Advance>
        </GameScores>}
      </GameScreenBackdrop>}
    </AnimatePresence>
  </GameOverlay>;
}
const LevelCounter = styled(GameScore)`
  position: fixed; top: max(28px, env(safe-area-inset-top)); left: 0; right: 0;
  z-index: 900; pointer-events: none; text-align: center;
  small { font-size: 22px; -webkit-text-stroke-width: 2px; }
`;
const Advance = styled(FloatingActionButton)`
  min-width: 200px;
  padding: 12px 24px;
`;
const LiveStatus = styled.div`
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
`;
