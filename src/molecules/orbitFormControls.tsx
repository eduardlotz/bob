import { useClickOutside } from "@/hooks/useClickOutside";
import { CloseIcon } from "@/icons/close";
import { HugColumn, HugRow } from "@/layout";
import { Magnetic } from "@/layout/Magnetic";
import { useCoreStore } from "@/store";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import styled from "styled-components";
import { useKeyPress } from "@/hooks/useKeyPress";
import { playUISound } from "@/utils/soundSystem";
import { OrbitForm } from "@/components/FileOrbit";
import { ToggleButton } from "@/apps/ui";

interface OrbitFormSelection {
  id: OrbitForm;
  name: string;
}

const orbitForms: Array<OrbitFormSelection> = [
  // {
  //   id: "FIBONACCI_SPHERE",
  //   name: "Kugel",
  // },
  {
    id: "EQUATORIAL_RING",
    name: "Ring",
  },
  // {
  //   id: "LOGARITHMIC_SPIRAL",
  //   name: "Spirale",
  // },
  // {
  //   id: "GALAXY_WAVES",
  //   name: "Galaxie",
  // },
];

export const OrbitFormControls = ({ show }: { show: boolean }) => {
  const { selectedOrbitForm: form, setOrbitForm } = useCoreStore();
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const [showForms, setShowForms] = useState(false);

  useClickOutside([containerRef, triggerRef], () => setShowForms(false));
  useKeyPress("Escape", () => {
    setShowForms(false);
    playUISound("ui-tap-close");
  });

  const onTriggerClick = () => {
    setShowForms((open) => !open);
    playUISound();
  };

  return (
    <AnimatePresence>
      {show && (
        <HugColumn
          key="orbit-forms-column"
          style={{ opacity: 0, translateZ: 0 }}
          initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 40, filter: "blur(6px)" }}
          transition={{
            type: "spring" as const,
            bounce: 0.5,
          }}
          $gap={"0.75rem"}
          $align="center"
          $justify="flex-end"
          ref={containerRef}
        >
          <AnimatePresence>
            {showForms && (
              <HugRow $gap={"0.25rem"} $align="center">
                {orbitForms.map((f, i) => {
                  return (
                    <ToggleButton
                      key={f.id}
                      initial={{ filter: "blur(6px)", opacity: 0 }}
                      animate={{
                        filter: "blur(0px)",
                        opacity: 1,
                        transition: {
                          delay: i * 0.05 + 0.02,
                        },
                      }}
                      exit={{ filter: "blur(6px)", opacity: 0 }}
                      transition={{
                        type: "spring" as const,
                        bounce: 0.2,
                      }}
                      onClick={() => setOrbitForm(f.id)}
                      whileTap={{ scale: 0.95 }}
                      $active={form === f.id}
                    >
                      {f.name}
                    </ToggleButton>
                  );
                })}
              </HugRow>
            )}
          </AnimatePresence>

          <Magnetic>
            <TriggerContainer
              key="tap-upgrades-container"
              onClick={onTriggerClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              style={{ borderRadius: "50px" }}
              ref={triggerRef}
            >
              {showForms ? (
                <motion.span
                  key="hide-forms-icon"
                  initial={{ filter: "blur(6px)", opacity: 0, y: 20 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  exit={{ filter: "blur(6px)", opacity: 0, y: -20 }}
                  transition={{
                    type: "spring" as const,
                    bounce: 0.2,
                  }}
                >
                  <CloseIcon />
                </motion.span>
              ) : (
                <motion.span
                  key="show-forms-icon"
                  initial={{ filter: "blur(6px)", opacity: 0, y: -20 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  exit={{ filter: "blur(6px)", opacity: 0, y: 20 }}
                  transition={{
                    type: "spring" as const,
                    bounce: 0.2,
                  }}
                >
                  Ansicht
                </motion.span>
              )}
            </TriggerContainer>
          </Magnetic>
        </HugColumn>
      )}
    </AnimatePresence>
  );
};

const LevelContainer = styled.div`
  display: flex;
  align-items: center;

  border-radius: 0.625rem;
  padding: 0.25rem 0.4rem;

  background-color: #010101;
  color: #fff;

  font-weight: 600;
  font-size: 0.75rem;
`;

const TapCosts = styled.div`
  display: flex;
  align-items: center;

  border-radius: 0.625rem;
  padding: 0.25rem 0.4rem;

  background-color: #ffff54;
  color: #010101;

  font-weight: 900;
  font-size: 0.75rem;
  word-break: none;
`;

const TriggerContainer = styled(motion.button)`
  display: inline-flex;
  width: fit-content;
  white-space: nowrap;
  align-items: center;
  justify-content: center;
  max-height: 2.25rem;

  padding: 0.5rem 0.75rem;
  border-radius: 50px;
  background-color: #fff;
  opacity: 1;

  font-size: 1rem;
  font-weight: 700;
  color: #212121;
  margin: 0 auto;
  overflow: clip;

  span {
    max-height: 1.5rem;
  }
`;

const UpgradeButton = styled(motion.button)`
  display: flex;
  padding: 0.5rem 0.75rem;
  background-color: rgba(0, 0, 0, 0.25);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
  border-radius: 0.875rem;

  font-size: 1rem;
  font-weight: 600;
  color: #fff;

  &:disabled {
    color: #ffffff81;
    background: #0000001e;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.5);
  }
`;
