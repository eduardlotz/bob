import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { useCoreStore } from "@/store";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { PANEL_SPRING } from "@/styles/panelMotion";
import { commitBobParameters, useBobEditor, type BobParameter } from "@/store/bobEditor";
import { DEFAULT_FORM_PARAMETERS, getBlobFormType, getSelectedBlobForm } from "@/types/blobForms";
import { useI18n } from "@/i18n";
import { FormParameterIcon } from "@/icons/formParameter";
import { ElasticValueSlider } from "./ElasticValueSlider";
import type { TrackKind } from "./elasticTrack";
import { getBobControlPosition } from "./bobEditorLayout";
import { getBobEditorGuide } from "@/store/config/bobEditorFraming";
import { getBobControlValues, getBobParameterKeys, normalizeBobEditorParameters } from "@/types/bobControlValues";

const kinds: Record<BobParameter, TrackKind> = { sphereRadius: "size", cubeWidth: "width", cubeHeight: "height", cubeDepth: "depth", cubeRadius: "rounding", eggUpperRadius: "size", eggLowerRadius: "depth" };
function useEditorViewport() {
  const [viewport, setViewport] = useState(() => ({ width: innerWidth, height: innerHeight, phoneWidth: Math.min(328, innerWidth - 32) }));
  useLayoutEffect(() => {
    const panel = document.querySelector<HTMLElement>("[data-phone-body]");
    const update = () => setViewport({ width: innerWidth, height: innerHeight, phoneWidth: panel?.offsetWidth ?? Math.min(328, innerWidth - 32) });
    const observer = new ResizeObserver(update);
    if (panel) observer.observe(panel);
    window.addEventListener("resize", update);
    update();
    return () => { observer.disconnect(); window.removeEventListener("resize", update); };
  }, []);
  return viewport;
}

export function BobSculptEditor() {
  const isPresent = useIsPresent();
  const forms = useCoreStore(state => state.blobForms);
  const selected = getSelectedBlobForm(forms);
  const formType = getBlobFormType(selected.id);
  const draft = useBobEditor(state => state.draft);
  const dragging = useBobEditor(state => state.dragging);
  const viewport = useEditorViewport();
  const mobile = viewport.width <= 1000 || viewport.height <= 600;
  const compactScale = viewport.height <= 700 ? 0.6 : 0.75;
  const compactThumbWidth = viewport.height <= 700 ? 116 : 106;
  const guide = getBobEditorGuide(viewport.width, viewport.height);
  const reducedMotion = useReducedMotion();
  const { messages, locale } = useI18n();
  const copy = messages.options.bobShape;
  const parameters = draft?.id === selected.id ? draft.parameters : selected.parameters;
  const [active, setActive] = useState<BobParameter>(formType === "sphere" ? "sphereRadius" : "cubeWidth");
  const keys = getBobParameterKeys(formType);
  const activeKey = keys.includes(active) ? active : keys[0];
  const previewFrame = useRef(0);
  const pending = useRef<{ key: BobParameter; value: number } | null>(null);

  useEffect(() => {
    if (!isPresent) return;
    useBobEditor.setState({ open: true });
    return () => {
      cancelAnimationFrame(previewFrame.current);
      previewFrame.current = 0;
      pending.current = null;
      useBobEditor.setState({ open: false, dragging: null, draft: null });
    };
  }, [isPresent]);
  useEffect(() => {
    setActive(keys[0]);
    useBobEditor.setState({ draft: null, dragging: null });
  }, [selected.id]);
  const release = () => {
    cancelAnimationFrame(previewFrame.current); previewFrame.current = 0; pending.current = null;
  };
  const queuePreview = (key: BobParameter, value: number) => {
    if (!isPresent) return;
    pending.current = { key, value };
    if (previewFrame.current) return;
    previewFrame.current = requestAnimationFrame(() => {
      previewFrame.current = 0;
      if (!pending.current) return;
      const { key, value } = pending.current;
      useBobEditor.setState({ draft: { id: selected.id, parameters: normalizeBobEditorParameters(formType, { ...selected.parameters, [key]: value }) } });
    });
  };
  const position = (key: BobParameter): CSSProperties => {
    if (mobile) return { width: viewport.phoneWidth, height: 160 * compactScale, "--slider-scale": compactScale } as CSSProperties;
    return getBobControlPosition(key, guide, formType);
  };
  return <>
    <FocusStyle $focused={isPresent && !!dragging} />
    <Editor style={{ "--phone-width": `${viewport.phoneWidth}px` } as CSSProperties} initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }} transition={reducedMotion ? { duration: 0 } : { ...PANEL_SPRING, opacity: { duration: 0.18 } }} aria-hidden={!isPresent} inert={!isPresent} data-bob-editor data-mobile={mobile} role="region" aria-label={messages.options.sections.bobShape}>
      {mobile && <ToolTabs initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }} transition={PANEL_SPRING} data-bob-secondary role="group" aria-label={copy.tools}>
        {keys.map(key => <button type="button" key={key} aria-pressed={activeKey === key} onClick={() => setActive(key)}><FormParameterIcon parameter={key} /><span>{formType === "cube" && key === "cubeWidth" ? copy.parameters.sphereRadius : copy.parameters[key]}</span></button>)}
      </ToolTabs>}
      <Tools>
        <AnimatePresence propagate mode="popLayout">
        {isPresent && (mobile ? [activeKey] : keys).map(key => {
          const config = getBobControlValues(formType, key, parameters);
          const base = DEFAULT_FORM_PARAMETERS[formType][key]!;
          const dirty = Math.abs((parameters[key] ?? base) - base) > 0.000001;
          const label = formType === "cube" && key === "cubeWidth" ? copy.parameters.sphereRadius : copy.parameters[key];
          const format = (number: number) => config.rounding ? `${Math.round(number / 10) * 10}%` : `${number.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}×`;
          return <Tool key={`${selected.id}-${key}`} initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }} animate={{ opacity: dragging && dragging !== key ? 0 : 1, scale: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.85 }} transition={PANEL_SPRING} style={position(key)} data-tool={key} data-muted={!!dragging && dragging !== key}>
            <ElasticValueSlider kind={mobile ? "width" : (key === "cubeWidth" && formType === "cube" ? "size" : key === "cubeRadius" && formType === "cube" ? "roundingLower" : kinds[key])} compact={mobile} horizontalLayout={mobile ? { width: viewport.phoneWidth / compactScale, inset: compactThumbWidth / 2 } : undefined} label={label} value={config.value} min={config.min} max={config.max} step={config.step} defaultValue={config.defaultValue} format={format} dirty={dirty} resetLabel={`${copy.resetValue}: ${label}`} minimumLabel={copy.minimum} maximumLabel={copy.maximum}
              limitText={config.constrained && config.value >= config.max ? copy.roundingLimit : undefined}
              onReset={() => commitBobParameters({ [key]: base })}
              onStart={() => {
                setActive(key);
                useBobEditor.setState({ dragging: key });
              }}
              onPreview={next => queuePreview(key, config.toModel(next))}
              onCommit={next => { release(); if (isPresent) commitBobParameters({ [key]: config.toModel(next) }); }}
              onCancel={() => { release(); useBobEditor.setState({ draft: null, dragging: null }); }}
            />
          </Tool>;
        })}
        </AnimatePresence>
      </Tools>
    </Editor>
  </>;
}

const FocusStyle = createGlobalStyle<{ $focused: boolean }>`
  [data-bob-secondary], [data-phone-body], [data-bob-navigation], [data-bob-hud] {
    transition: opacity 180ms ease, filter 180ms ease;
    ${({ $focused }) => $focused ? "opacity: 0 !important; pointer-events: none !important;" : ""}
  }
  ${({ $focused }) => $focused ? "[data-phone-body] *, [data-bob-navigation] *, [data-bob-hud] * { pointer-events: none !important; }" : ""}
  @media (prefers-reduced-motion: reduce) { [data-bob-secondary], [data-phone-body], [data-bob-navigation], [data-bob-hud] { transition: none; } }
  @media (orientation: landscape) and (max-height: 600px) {
    [data-phone-body] { left: 12px !important; right: auto !important; width: calc(50vw - 32px) !important; max-width: calc(50vw - 32px) !important; min-width: 0 !important; }
    [data-phone-body] [data-bob-form-panel] { width: 100%; max-width: 100%; }
  }
`;
const Editor = styled(motion.div)`
  position: fixed; inset: 0; z-index: 1000; pointer-events: none;
  &[aria-hidden="true"], &[aria-hidden="true"] * { pointer-events: none !important; }
  &[data-mobile="true"] { top: auto; bottom: calc(164px + env(safe-area-inset-bottom, 0px)); left: 12px; right: 12px; display: flex; flex-direction: column; align-items: center; }
  @media (max-height: 700px) and (max-width: 760px) { &[data-mobile="true"] { bottom: 178px; } }
  @media (orientation: landscape) and (max-height: 600px) { &[data-mobile="true"] { left: auto; right: 12px; top: 8px; bottom: auto; width: min(var(--phone-width), calc(50vw - 24px)); } }
`;
const ToolTabs = styled(motion.div)`
  display: flex; justify-content: center; gap: 4px; max-width: 100%; margin-bottom: 0; pointer-events: auto;
  button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; min-width: 62px; min-height: 56px; padding: 7px 9px; border-radius: 18px; background: #212026; color: white; font-size: 12px; font-weight: 800; border: 2px solid #0b0b0c; box-shadow: 0 3px 0 #0b0b0c; }
  button[aria-pressed="true"] { background: #212026; border-color: #0b0b0c; box-shadow: 0 3px 0 #0b0b0c, inset 0 0 0 2px white; }
  button[aria-pressed="false"] { color: #929294; }
  button:focus-visible { outline: 2px solid white; outline-offset: 3px; }
  @media (max-width: 350px) { button { min-width: 54px; padding: 6px; font-size: 11px; } }
  @media (orientation: landscape) and (max-height: 600px) { width: 100%; button { min-width: 0; flex: 1; padding: 6px; font-size: 11px; } }
`;
const Tools = styled.div`
  [data-mobile="true"] & { position: relative; width: min(320px, calc(100vw - 24px)); height: 124px; display: flex; align-items: center; justify-content: center; }
  @media (max-height: 700px) {
    [data-mobile="true"] & { height: 124px; width: min(320px, 100%); }
  }
`;
const Tool = styled(motion.div)`
  position: absolute; width: fit-content;
  &[data-muted="true"] { pointer-events: none; } &[data-muted="true"] * { pointer-events: none !important; }
  [data-mobile="true"] & { position: relative; flex-shrink: 0; }
  [data-mobile="true"] & [data-elastic-slider] { position: absolute; left: 0; top: 0; transform: scale(var(--slider-scale)); transform-origin: top left; }
`;
