import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import styled from "styled-components";
import { AnimatedSegmentedControl } from "@/components/AnimatedSegmentedControl";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { PriceTag, TimeChip } from "@/components/StatusChips";
import { ItemStatusChip } from "@/apps/ui";
import { useCoreStore, useViewStore, type ShopItem } from "@/store";
import { useI18n } from "@/i18n";
import { getShopItemCopy } from "@/shop-items/copy";
import { PANEL_SPRING, getPanelItemMotion, usePanelMotion } from "@/styles/panelMotion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import { EyeIcon } from "@/icons/eye";
import thumbnails from "../../public/images/shop-items/manifest.json";

type ShopTab = "hats" | "accessories" | "effects" | "worlds";
const itemThumbnails: Record<string, string> = thumbnails.items;

export function ShopOverlay() {
  const panelMotion = usePanelMotion();
  const reducedMotion = useReducedMotion();
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const scrollPosition = useRef(0);
  const catalogueIsActive = useRef(true);
  const catalogueRef = useRef<HTMLDivElement>(null);
  const currentView = useViewStore((state) => state.currentView);
  const isTransitioning = useViewStore((state) => state.isTransitioning);
  const [activeTab, setActiveTab] = useState<ShopTab>("hats");
  const { locale, messages } = useI18n();
  const isPresent = useIsPresent();
  const store = useCoreStore();
  const { bobItems, tapEffects, worlds, taps, resetPreview } = store;

  useEffect(() => {
    resetPreview();
    return () => {
      resetPreview();
      const view = useViewStore.getState();
      if (view.currentView === "shop:preview") view.resetToDefaultView();
    };
  }, [resetPreview]);

  useLayoutEffect(() => {
    const catalogue = catalogueRef.current;
    if (!catalogue || previewItem) return;
    catalogueIsActive.current = true;
    catalogue.scrollTop = scrollPosition.current;
    const update = () => updateScrollFades(catalogue);
    const observer = new ResizeObserver(update);
    observer.observe(catalogue);
    if (catalogue.firstElementChild) observer.observe(catalogue.firstElementChild);
    update();
    return () => observer.disconnect();
  }, [activeTab, previewItem]);

  useEffect(() => {
    if (!isPresent || isTransitioning) return;
    const view = useViewStore.getState();
    if (previewItem && currentView !== "shop:preview") view.transitionToView("shop:preview");
    else if (!previewItem && currentView === "shop:preview") view.resetToDefaultView();
  }, [previewItem, currentView, isTransitioning, isPresent]);

  const openPreview = (item: ShopItem) => {
    if (!previewItem) scrollPosition.current = catalogueRef.current?.scrollTop ?? scrollPosition.current;
    // popLayout keeps the old catalogue mounted during its exit. Ignore any
    // scroll events caused by that exiting layout so Back restores this offset.
    catalogueIsActive.current = false;
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
  const preview = categories[activeTab].find((item) => item.id === previewItem);
  const stepPreview = (direction: -1 | 1) => {
    if (!preview || items.length < 2) return;
    const index = items.findIndex((item) => item.id === preview.id);
    openPreview(items[(index + direction + items.length) % items.length]);
  };

  const getItemActionProps = (item: ShopItem) => {
    const name = getShopItemCopy(item.id, locale)?.name ?? item.name;
    const label = item.enabled ? messages.shop.actions.selected
      : item.purchased ? messages.shop.actions.equip : messages.shop.actions.purchase;
    const canRemove = item.enabled && activeTab !== "worlds";
    const removeLabel = activeTab === "effects" ? messages.shop.actions.deactivate : messages.shop.actions.takeOff;
    return {
      $active: item.enabled,
      $variant: item.enabled ? "dark" as const : item.purchased ? "muted" as const : "blue" as const,
      disabled: (!item.purchased && !store.canAfford(item.cost)) || (item.enabled && activeTab === "worlds"),
      "aria-label": `${canRemove ? removeLabel : label}: ${name}`,
      "aria-pressed": item.purchased ? item.enabled : undefined,
      children: label,
    };
  };

  const handleItem = (item: ShopItem) => {
    // Read the current store so rapid repeated clicks cannot buy twice.
    const current = useCoreStore.getState();
    const source = activeTab === "effects" ? current.tapEffects
      : activeTab === "worlds" ? current.worlds : current.bobItems;
    const latest = source.find((entry) => entry.id === item.id);
    if (!latest || (!latest.purchased && !current.canAfford(latest.cost))) return false;

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
    return true;
  };

  return createPortal(
    <OverlayAnchor {...panelMotion} initial={false} layoutRoot aria-hidden={!isPresent} inert={!isPresent}>
      <AnimatePresence mode="popLayout" anchorY="bottom">
      {!previewItem ? <ShopPanel
        key="shop-catalogue"
        role="dialog"
        aria-label={messages.navigation.shopLabel}
        aria-hidden={!isPresent}
        {...panelMotion}
      >
        <StatusBar>
          <TimeChip />
          <PriceTag value={Math.floor(taps)} />
        </StatusBar>
        <CatalogueFrame>
        <Catalogue key={activeTab} aria-label={messages.shop.tabs[activeTab]}
          ref={catalogueRef}
          onScroll={(event) => {
            if (!catalogueIsActive.current) return;
            scrollPosition.current = event.currentTarget.scrollTop;
            updateScrollFades(event.currentTarget);
          }}
        >
          <ItemGrid>
            {items.map((item, index) => {
              const name = getShopItemCopy(item.id, locale)?.name ?? item.name;
              return (
                <ItemCard key={item.id} data-shop-item={item.id} {...getPanelItemMotion(index, reducedMotion)}>
                  <ItemMedia>
                    <Thumbnail $active={item.enabled} $owned={item.purchased}>
                      <img src={itemThumbnails[item.id]} alt="" width={80} height={80} draggable={false} />
                    </Thumbnail>
                    <ItemToolbar>
                    {!item.purchased && <PriceTag value={item.cost} />}
                    <PreviewButton type="button" onClick={() => openPreview(item)}
                      aria-label={`${messages.shop.actions.preview}: ${name}`} data-ui-sound-id="ui-tap">
                      <EyeIcon />
                    </PreviewButton>
                    </ItemToolbar>
                  </ItemMedia>
                  <ItemName>{name}</ItemName>
                  <ItemAction
                    {...getItemActionProps(item)}
                    type="button"
                    onClick={() => handleItem(item)}
                    data-ui-sound-id="ui-tap"
                  />
                </ItemCard>
              );
            })}
          </ItemGrid>
        </Catalogue>
        </CatalogueFrame>
        <CategoryBar>
          <AnimatedSegmentedControl
            options={(["hats", "accessories", "effects", "worlds"] as const).map((value) => ({ value, label: messages.shop.tabs[value] }))}
            value={activeTab}
            onChange={(tab) => { scrollPosition.current = 0; setActiveTab(tab); }}
            layoutId="shop-categories"
            fullWidth
          />
        </CategoryBar>
      </ShopPanel> : <PreviewControls
        key="shop-preview-controls"
        role="group"
        aria-label={preview ? getShopItemCopy(preview.id, locale)?.name ?? preview.name : undefined}
        layout
        {...panelMotion}
      >
        {preview && <>
          <PreviewPagination>
          <PreviewNavButton $variant="white" type="button" onClick={() => stepPreview(-1)}
            disabled={items.length < 2} aria-label={messages.shop.actions.previousItem} data-ui-sound-id="ui-tap">
            <ChevronLeftIcon />
          </PreviewNavButton>
          <PreviewDetails layout transition={PANEL_SPRING} aria-live="polite" aria-atomic="true">
            <PreviewNameTag $variant="dark" layout="position" transition={PANEL_SPRING}>
              <span>{getShopItemCopy(preview.id, locale)?.name ?? preview.name}</span>
              <span>{messages.shop.itemTypes[preview.type as keyof typeof messages.shop.itemTypes]}</span>
            </PreviewNameTag>
          <AnimatePresence mode="popLayout" initial={false}>
            {!preview.purchased && <motion.div key="preview-price" layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }} transition={PANEL_SPRING}>
              <PriceTag value={preview.cost} />
            </motion.div>}
          </AnimatePresence>
          </PreviewDetails>
          <PreviewNavButton $variant="white" type="button" onClick={() => stepPreview(1)}
            disabled={items.length < 2} aria-label={messages.shop.actions.nextItem} data-ui-sound-id="ui-tap">
            <ChevronRightIcon />
          </PreviewNavButton>
          </PreviewPagination>
          <PreviewAction {...getItemActionProps(preview)} layout type="button"
            onClick={() => { if (handleItem(preview)) resetPreview(); }} data-ui-sound-id="ui-tap" />
        </>}
        <PreviewBackButton $variant="white" type="button" onClick={backToShop} data-ui-sound-id="ui-tap-close">
          {messages.shop.actions.backToShop}
        </PreviewBackButton>
      </PreviewControls>}
      </AnimatePresence>
    </OverlayAnchor>,
    document.getElementById("motion-root")!,
  );
}

function updateScrollFades(element: HTMLDivElement) {
  const frame = element.parentElement;
  frame?.style.setProperty("--scroll-top-opacity", String(Math.min(1, Math.max(0, element.scrollTop) / 22)));
  frame?.style.setProperty("--scroll-bottom-opacity", String(Math.min(1, Math.max(0, element.scrollHeight - element.clientHeight - element.scrollTop) / 22)));
}

const OverlayAnchor = styled(motion.div)`
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
const CatalogueFrame = styled.div`
  --catalogue-color: #eae9ee;
  position: relative;
  isolation: isolate;
  min-height: 0;
  display: flex;
  overflow: hidden;
  border-radius: 24px;
  background: var(--catalogue-color);
  &::before, &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 22px;
    z-index: 1;
    pointer-events: none;
  }
  &::before {
    top: 0;
    background: linear-gradient(var(--catalogue-color), transparent);
    opacity: var(--scroll-top-opacity, 0);
  }
  &::after {
    bottom: 0;
    background: linear-gradient(transparent, var(--catalogue-color));
    opacity: var(--scroll-bottom-opacity, 0);
  }
`;
const Catalogue = styled.div`
  width: 100%;
  min-height: 0;
  height: 25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  border-radius: 24px;
  background: var(--catalogue-color);
`;
const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 16px;
  row-gap: 20px;
  padding: 16px 10px 24px;
  @media (max-width: 560px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
  }
`;
const ItemCard = styled(motion.article)`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
`;
const ItemMedia = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 10px;
`;
const ItemToolbar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  > button { margin-left: auto; }
`;
const Thumbnail = styled.div<{ $active: boolean; $owned: boolean }>`
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: ${({ $active }) => $active ? "radial-gradient(circle, #fff 0%, #D0CEDD 70%)" : "#D0CEDD"};
  &::after {
    content: ${({ $active }) => $active ? '""' : "none"};
    position: absolute;
    inset: 2px;
    border: 1.5px solid #000;
    border-radius: 22px;
    pointer-events: none;
  }
  img {
    width: 80px;
    height: 80px;
    object-fit: contain;
    filter: ${({ $owned }) => $owned ? "none" : "grayscale(1)"};
    opacity: ${({ $owned }) => $owned ? 1 : 0.5};
  }
`;
const ItemName = styled.h3`
  font-size: 1rem;
  line-height: 1.15;
  font-weight: 900;
  text-align: center;
  margin: 8px 0 4px;
  min-height: 2.3em;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-wrap: anywhere;
`;
const ItemAction = styled(FloatingActionButton)`
  position: relative;
  width: 100%;
  min-height: 52px;
  padding: 10px 6px;
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
  flex-shrink: 0;
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
const PreviewControls = styled(motion.div)`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: min(480px, 100%);
  margin: 0 auto 12px;
  pointer-events: auto;
`;
const PreviewPagination = styled.div`
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 24px;
  width: 100%;
  @media (max-width: 560px) {
    grid-template-columns: 48px minmax(0, 1fr) 48px;
    gap: 8px;
  }
`;
const PreviewNavButton = styled(FloatingActionButton)`
  width: 64px;
  height: 64px;
  padding: 0;
  @media (max-width: 560px) {
    width: 48px;
    height: 48px;
    border-radius: 18px;
  }
`;
const PreviewDetails = styled(motion.div)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  width: 100%;
  > div { flex-shrink: 0; }
`;
const PreviewNameTag = styled(ItemStatusChip)`
  min-width: 0;
  max-width: 100%;
  height: auto;
  min-height: 1.375rem;
  span:first-child { min-width: 0; overflow-wrap: anywhere; }
  span:last-child { flex-shrink: 0; white-space: nowrap; }
`;
const PreviewAction = styled(ItemAction)`
  width: min(240px, 100%);
`;
const PreviewBackButton = styled(FloatingActionButton)`
  width: min(240px, 100%);
`;
