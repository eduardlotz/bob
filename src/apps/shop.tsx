import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent } from "motion/react";
import styled from "styled-components";
import { AnimatedSegmentedControl } from "@/components/AnimatedSegmentedControl";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useCoreStore, useViewStore, type ShopItem } from "@/store";
import { useI18n } from "@/i18n";
import { getShopItemCopy } from "@/shop-items/copy";
import { formatNumber } from "@/utils/formatNumber";
import { PANEL_SPRING } from "@/styles/panelMotion";
import { ChevronLeftIcon } from "@/icons/chevron";
import { EyeIcon } from "@/icons/eye";
import thumbnails from "../../public/images/shop-items/manifest.json";

type ShopTab = "hats" | "accessories" | "effects" | "worlds";
const itemThumbnails: Record<string, string> = thumbnails.items;

export function ShopOverlay() {
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const scrollPosition = useRef(0);
  const currentView = useViewStore((state) => state.currentView);
  const isTransitioning = useViewStore((state) => state.isTransitioning);
  const [activeTab, setActiveTab] = useState<ShopTab>("hats");
  const [time, setTime] = useState(() => new Date());
  const { locale, messages } = useI18n();
  const isPresent = useIsPresent();
  const store = useCoreStore();
  const { bobItems, tapEffects, worlds, taps, resetPreview } = store;

  useEffect(() => {
    resetPreview();
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => {
      window.clearInterval(timer);
      resetPreview();
      const view = useViewStore.getState();
      if (view.currentView === "shop:preview") view.resetToDefaultView();
    };
  }, [resetPreview]);

  useEffect(() => {
    if (!isPresent || isTransitioning) return;
    const view = useViewStore.getState();
    if (previewItem && currentView !== "shop:preview") view.transitionToView("shop:preview");
    else if (!previewItem && currentView === "shop:preview") view.resetToDefaultView();
  }, [previewItem, currentView, isTransitioning, isPresent]);

  const openPreview = (item: ShopItem) => {
    resetPreview();
    if (activeTab === "worlds") store.previewWorld(item.id);
    else if (activeTab === "effects") store.previewTapEffect(item.id);
    else store.previewBobItem(item.id);
    setPreviewItem(item.id);
  };

  const backToShop = () => {
    resetPreview();
    setPreviewItem(null);
  };

  const visibleBobItems = bobItems.filter((item) => item.unlocked !== false);
  const categories: Record<ShopTab, ShopItem[]> = {
    hats: visibleBobItems.filter((item) => item.type === "hat"),
    accessories: visibleBobItems.filter((item) => item.type !== "hat"),
    effects: tapEffects,
    worlds,
  };
  const items = [...categories[activeTab]].sort((a, b) => a.cost - b.cost);

  const handleItem = (item: ShopItem) => {
    // Read the current store so rapid repeated clicks cannot buy twice.
    const current = useCoreStore.getState();
    const source = activeTab === "effects" ? current.tapEffects
      : activeTab === "worlds" ? current.worlds : current.bobItems;
    const latest = source.find((entry) => entry.id === item.id);
    if (!latest || (!latest.purchased && !current.canAfford(latest.cost))) return;

    if (activeTab === "effects") {
      if (!latest.purchased) current.purchaseTapEffect(latest.id);
      else current.selectTapEffect(latest.id);
    } else if (activeTab === "worlds") {
      if (!latest.purchased) current.purchaseWorld(latest.id);
      else current.selectWorld(latest.id);
    } else {
      if (!latest.purchased) current.purchaseBobItem(latest.id);
      else if (latest.enabled) current.unequipBobItem(latest.id);
      else current.equipBobItem(latest.id);
    }
  };

  return createPortal(
    <OverlayAnchor aria-hidden={!isPresent}>
      <AnimatePresence mode="wait">
      {!previewItem ? <ShopPanel
        key="shop-catalogue"
        role="dialog"
        aria-label={messages.navigation.shopLabel}
        aria-hidden={!isPresent}
        initial={{ opacity: 0, scale: 0.94, y: 24, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.96, y: 20, filter: "blur(4px)" }}
        transition={PANEL_SPRING}
      >
        <StatusBar>
          <StatusPill>{time.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</StatusPill>
          <StatusPill aria-live="polite">{formatNumber(Math.floor(taps))} <span aria-hidden="true">🫵</span></StatusPill>
        </StatusBar>
        <Catalogue key={activeTab} aria-label={messages.shop.tabs[activeTab]}
          ref={(element) => { if (element) element.scrollTop = scrollPosition.current; }}
          onScroll={(event) => { scrollPosition.current = event.currentTarget.scrollTop; }}
        >
          <ItemGrid>
            {items.map((item) => {
              const name = getShopItemCopy(item.id, locale)?.name ?? item.name;
              const canAfford = store.canAfford(item.cost);
              const label = item.enabled ? messages.shop.actions.selected
                : item.purchased ? messages.shop.actions.equip : messages.shop.actions.purchase;
              const canRemove = item.enabled && activeTab !== "worlds";
              const removeLabel = activeTab === "effects" ? messages.shop.actions.deactivate : messages.shop.actions.takeOff;
              return (
                <ItemCard key={item.id} data-shop-item={item.id}>
                  <Thumbnail $active={item.enabled}>
                    <img src={itemThumbnails[item.id]} alt="" width={80} height={80} draggable={false} />
                    <PreviewButton type="button" onClick={() => openPreview(item)}
                      aria-label={`${messages.shop.actions.preview}: ${name}`} data-ui-sound-id="ui-tap">
                      <EyeIcon />
                    </PreviewButton>
                  </Thumbnail>
                  <ItemName>{name}</ItemName>
                  <PriceSlot>
                    {!item.purchased && <Price>{formatNumber(item.cost)} <span aria-hidden="true">🫵</span></Price>}
                  </PriceSlot>
                  <ItemAction
                    type="button"
                    $active={item.enabled}
                    $owned={item.purchased}
                    disabled={(!item.purchased && !canAfford) || (item.enabled && activeTab === "worlds")}
                    aria-label={`${canRemove ? removeLabel : label}: ${name}`}
                    aria-pressed={item.purchased ? item.enabled : undefined}
                    onClick={() => handleItem(item)}
                    data-ui-sound-id="ui-tap"
                  >{label}</ItemAction>
                </ItemCard>
              );
            })}
          </ItemGrid>
        </Catalogue>
        <CategoryBar>
          <AnimatedSegmentedControl
            options={(["hats", "accessories", "effects", "worlds"] as const).map((value) => ({ value, label: messages.shop.tabs[value] }))}
            value={activeTab}
            onChange={(tab) => { scrollPosition.current = 0; setActiveTab(tab); }}
            layoutId="shop-categories"
            fullWidth
          />
        </CategoryBar>
      </ShopPanel> : <PreviewBackButton
        key="shop-preview-back"
        type="button"
        onClick={backToShop}
        data-ui-sound-id="ui-tap-close"
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.95 }}
        transition={PANEL_SPRING}
      ><ChevronLeftIcon />{messages.shop.actions.backToShop}</PreviewBackButton>}
      </AnimatePresence>
    </OverlayAnchor>,
    document.getElementById("motion-root")!,
  );
}

const OverlayAnchor = styled.div`
  position: fixed;
  bottom: 94px;
  left: 0;
  right: 0;
  margin: 0 auto;
  width: min(43.25rem, calc(100vw - 32px));
  z-index: 1001;
  pointer-events: none;
  &[aria-hidden="true"], &[aria-hidden="true"] * { pointer-events: none !important; }
`;

const ShopPanel = styled(motion.div)`
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 4px;
  border-radius: 24px;
  border: 1px solid rgba(120, 117, 141, 0.35);
  background: #fff;
  color: #212121;
  max-height: calc(100dvh - 124px);
  pointer-events: auto;
  transform-origin: bottom center;
  &[aria-hidden="true"], &[aria-hidden="true"] * { pointer-events: none !important; }
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
`;
const StatusPill = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  min-height: 40px;
  border-radius: 999px;
  background: #ededf0;
  font-size: 1.125rem;
  font-weight: 900;
`;
const Catalogue = styled.div`
  min-height: 0;
  height: 25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  border-radius: 24px;
  background: #eae9ee;
  mask-image: linear-gradient(#000 calc(100% - 22px), transparent);
`;
const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 24px;
  row-gap: 24px;
  padding: 16px 10px 32px;
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
  }
`;
const ItemCard = styled.article`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
`;
const Thumbnail = styled.div<{ $active: boolean }>`
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: #d2cfdf;
  outline: ${({ $active }) => $active ? "3px solid #212026" : "3px solid transparent"};
  outline-offset: 3px;
  box-shadow: ${({ $active }) => $active ? "inset 0 0 0 2px #fff, inset 0 0 15px rgba(255,255,255,0.8)" : "none"};
  img { width: 80px; height: 80px; object-fit: contain; }
`;
const ItemName = styled.h3`
  font-size: 1rem;
  line-height: 1.15;
  font-weight: 900;
  text-align: center;
  margin: 10px 0 0;
  min-height: 2.3em;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-wrap: anywhere;
`;
const PriceSlot = styled.div`
  height: 28px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
`;
const Price = styled.span`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  background: #ffff50;
  font-size: 0.875rem;
  line-height: 1.1;
  font-weight: 900;
`;
const ItemAction = styled.button<{ $active: boolean; $owned: boolean }>`
  position: relative;
  width: 100%;
  min-height: 52px;
  padding: 10px 6px;
  border-radius: 24px;
  background: ${({ $active, $owned }) => $active ? "#212026" : $owned ? "#78758d" : "#4178f7"};
  border: 3px solid ${({ $active, $owned }) => $active ? "#0b0b0c" : $owned ? "#555363" : "#2a5ee2"};
  box-shadow: 0 5px 0 ${({ $active, $owned }) => $active ? "#0b0b0c" : $owned ? "#555363" : "#2a5ee2"};
  color: #fff;
  font-size: 1rem;
  font-weight: 900;
  flex-shrink: 0;
  &::after {
    content: "";
    position: absolute;
    inset: 1px;
    border: 2px solid ${({ $active }) => $active ? "#fff" : "transparent"};
    border-radius: 18px;
    pointer-events: none;
  }
  &:disabled { opacity: ${({ $active }) => $active ? 1 : 0.25}; cursor: default; }
  &:hover:not(:disabled) { filter: brightness(1.05); }
  &:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 2px 0 ${({ $active, $owned }) => $active ? "#0b0b0c" : $owned ? "#555363" : "#2a5ee2"}; }
  &:focus-visible { outline: 3px solid #212026; outline-offset: 7px; }
`;
const CategoryBar = styled.div`
  flex-shrink: 0;
  > div { background: #eae9ee; }
  @media (max-width: 560px) {
    button { padding-inline: 7px; font-size: 0.8rem; }
  }
`;

const PreviewButton = styled.button`
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 6px;
  border-radius: 11px;
  background: rgba(33, 32, 38, 0.65);
  color: #fff;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  &:hover { background: rgba(33, 32, 38, 0.85); }
  &:active { transform: scale(0.92); }
  &:focus-visible { outline: 2px solid #4178f7; outline-offset: 3px; }
`;
const PreviewBackButton = styled(FloatingActionButton)`
  margin: 0 auto 12px;
`;
