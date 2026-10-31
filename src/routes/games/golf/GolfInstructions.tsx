import { motion, useReducedMotion } from 'motion/react';
import { PANEL_SPRING } from '@/styles/panelMotion';
import { GameTutorial } from '../GameScreenStyles';
export function GolfInstructions({ de, mobile }: { de: boolean; mobile: boolean }) {
  const reduced = useReducedMotion();
  const loop = { duration: 3.2, repeat: Infinity, times: [0, .35, .5, .8, 1], ease: 'easeInOut' as const };
  return <GameTutorial initial={{ opacity: 0, scale: reduced ? 1 : .8 }} animate={{ opacity: 1, scale: 1 }} transition={PANEL_SPRING}>
    <svg width="240" height="200" viewBox="0 0 240 200" fill="none" aria-hidden="true">
      <path d="M72 158 86 31h68l14 127Z" fill="#6cbe81" stroke="#202630" strokeWidth="3" />
      <ellipse cx="120" cy="48" rx="10" ry="4" fill="#202630" />
      <path d="M120 48V10l27 7-27 8" stroke="white" strokeWidth="3" fill="#ec6b5d" strokeLinejoin="round" />
      <motion.g animate={reduced ? {} : { opacity: [1, 1, 0, 0, 1] }} transition={loop}>
        {Array.from({ length: 10 }, (_, i) => <motion.circle key={i} cx="120" r="2" fill="white" stroke="black" strokeWidth="1"
          cy={136 - i * 5.6} animate={reduced ? {} : { cy: [136 - i, 136 - i * 5.6, 136 - i * 5.6, 136 - i, 136 - i] }} transition={loop} />)}
        {[-1, 1].flatMap(side => [1, 2, 3].map(i => <motion.circle key={`${side}:${i}`} r="2" fill="white" stroke="black" strokeWidth="1"
          cx={120 + side * i * 3.5} cy={86 + i * 3.5}
          animate={reduced ? {} : { cx: [120 + side * i, 120 + side * i * 3.5, 120 + side * i * 3.5, 120 + side * i, 120 + side * i], cy: [126 + i, 86 + i * 3.5, 86 + i * 3.5, 126 + i, 126 + i] }} transition={loop} />))}
      </motion.g>
      <path d="M146 134V87" stroke="white" strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" />
      <motion.path d="M146 134V87" strokeWidth="3" strokeLinecap="round" style={{ originX: '146px', originY: '134px' }}
        animate={reduced ? { scaleY: .5, stroke: '#65df66' } : { scaleY: [.08, 1, 1, .08, .08], stroke: ['#65df66', '#ee6050', '#ee6050', '#65df66', '#65df66'], opacity: [1, 1, 0, 0, 1] }} transition={loop} />
      <motion.circle cx="120" cy="136" r="7" fill="white" stroke="#202630" strokeWidth="3"
        animate={reduced ? {} : { cy: [136, 136, 136, 48, 136], scale: [1, 1, 1, .5, 1] }} transition={loop} />
      <motion.g animate={reduced ? {} : { y: [0, 28, 28, 0, 0], opacity: [1, 1, 0, 0, 1] }} transition={loop}>
        {mobile ? <path d="m113 168-6-9c-3-4 2-8 5-4l3 4v-19c0-5 7-5 7 0v12c8-3 17 1 17 7v6c0 5-4 9-4 9h-16Z" fill="#202630" stroke="white" strokeWidth="2.5" /> : <g stroke="white" strokeWidth="2.5"><rect x="109" y="146" width="22" height="34" rx="11" fill="#202630" /><path d="M120 151v6m-10 4h20" /></g>}
      </motion.g>
    </svg>
    <h2>{de ? 'Bob ziehen & loslassen' : 'Pull Bob & release'}</h2>
    <strong>{mobile ? (de ? 'Tippen zum Start' : 'Tap to start') : (de ? 'Klick oder Leertaste' : 'Click or space')}</strong>
  </GameTutorial>;
}
