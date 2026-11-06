import { motion, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { useSoundSystem } from "@/hooks/useSoundSystem";
import { useI18n } from "@/i18n";

const speakerPath = "M14.156 5.30937C14.1071 4.11504 13.5106 3.10566 12.5796 2.69008C11.5922 2.24937 10.481 2.5846 9.72039 3.59613C9.44659 3.96024 9.18274 4.3426 8.93372 4.73334C8.44489 5.50042 7.6315 5.99653 6.74801 6.05373C6.25541 6.08562 5.83247 6.12976 5.46446 6.18215C3.69508 6.43397 2.4234 7.88646 2.1323 9.5547C2.00068 10.309 1.90039 11.1626 1.90039 11.999C1.90039 12.8354 2.00068 13.6891 2.1323 14.4434C2.4234 16.1116 3.69508 17.564 5.46446 17.8159C5.83247 17.8682 6.25541 17.9123 6.74801 17.9443C7.6315 18.0015 8.44489 18.4976 8.93372 19.2648C9.18274 19.6554 9.44659 20.0378 9.72039 20.4019C10.481 21.4135 11.5922 21.7486 12.5796 21.308C13.5106 20.8923 14.1071 19.883 14.156 18.6887C14.2231 17.0473 14.2769 14.8444 14.2769 11.999C14.2769 9.15362 14.2231 6.95074 14.156 5.30937Z";
const soundPath = "M19.8417 5.66739C19.3768 5.25511 18.6657 5.2978 18.2533 5.76274C17.8411 6.22766 17.8838 6.93878 18.3487 7.35106C19.4544 8.33146 20.279 9.89036 20.279 11.9989C20.279 14.1074 19.4544 15.6663 18.3487 16.6468C17.8838 17.059 17.8411 17.7701 18.2533 18.235C18.6657 18.6999 19.3768 18.7427 19.8417 18.3305C21.4412 16.912 22.5293 14.7346 22.5293 11.9989C22.5293 9.26323 21.4412 7.08574 19.8417 5.66739ZM17.6583 9.63997C17.1984 9.22218 16.4868 9.25639 16.069 9.71637C15.6512 10.1764 15.6854 10.8879 16.1454 11.3057C16.2755 11.4239 16.4087 11.6377 16.4087 11.9991C16.4087 12.3605 16.2755 12.5743 16.1454 12.6925C15.6854 13.1103 15.6512 13.8219 16.069 14.2818C16.4868 14.7418 17.1984 14.776 17.6583 14.3582C18.2704 13.8023 18.659 12.978 18.659 11.9991C18.659 11.0202 18.2704 10.1959 17.6583 9.63997Z";
const mutePath = "M17.297 8.95294C16.8575 8.51351 16.1451 8.51351 15.7057 8.95294C15.2662 9.39238 15.2662 10.1049 15.7057 10.5443L17.1605 11.9991L15.7057 13.4539C15.2663 13.8934 15.2663 14.6058 15.7057 15.0453C16.1452 15.4847 16.8577 15.4847 17.2971 15.0453L18.7519 13.5905L20.2066 15.0453C20.646 15.4847 21.3586 15.4847 21.798 15.0453C22.2375 14.6058 22.2375 13.8934 21.798 13.4539L20.3433 11.9991L21.798 10.5443C22.2375 10.1049 22.2375 9.39238 21.798 8.95294C21.3586 8.51351 20.6462 8.51351 20.2067 8.95294L18.7519 10.4078L17.297 8.95294Z";

export function PhoneSoundToggle() {
  const sound = useSoundSystem();
  const { messages } = useI18n();
  const reducedMotion = useReducedMotion();
  return <SoundSwitch type="button" role="switch" aria-checked={sound.isActive}
    aria-label={messages.phone.soundLabel} $active={sound.isActive}
    onClick={() => {
      if (!sound.isEnabled) { sound.enable(); if (sound.isMuted) void sound.unmute(); }
      else sound.toggleMute();
    }}>
    <SoundGlyph initial={false} animate={{ x: sound.isActive ? 0 : 26 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g opacity="0.5">
          <path fillRule="evenodd" clipRule="evenodd" d={speakerPath + (sound.isActive ? soundPath : mutePath)} fill={sound.isActive ? "white" : "#212121"} />
        </g>
      </svg>
    </SoundGlyph>
    <Knob initial={false} animate={{ x: sound.isActive ? 34 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }} />
  </SoundSwitch>;
}

const SoundSwitch = styled.button<{ $active: boolean }>`
  position: relative; width: 70px; height: 36px; padding: 0; flex-shrink: 0;
  border-radius: 999px; background: ${({ $active }) => $active ? "#3bce46" : "#bfbfbf"};
  box-shadow: 0 2px 0 ${({ $active }) => $active ? "#13a51b" : "#7c7c7c"};
  transition: background-color 0.2s, box-shadow 0.2s;
  &:focus-visible { outline: 3px solid #4178f7; outline-offset: 4px; }
`;
// The circle has 6px edge padding; the icon side has 4px more (10px).
const SoundGlyph = styled(motion.span)`
  position: absolute; inset: 6px auto auto 10px; width: 24px; height: 24px;
`;
const Knob = styled(motion.span)`
  position: absolute; top: 6px; left: 6px; width: 24px; height: 24px;
  border-radius: 50%; background: white; box-shadow: 0 1px 1px #0002;
`;
