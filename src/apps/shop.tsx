import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  forwardRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useShallow } from "zustand/react/shallow";
import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
  useAnimationControls,
} from "motion/react";
import styled from "styled-components";
import { Magnetic } from "@/layout/Magnetic";
import { AnimatedSegmentedControl } from "@/components/AnimatedSegmentedControl";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { PriceTag } from "@/components/StatusChips";
import { ItemStatusChip } from "@/apps/ui";
import { useCoreStore, useViewStore, type ShopItem } from "@/store";
import { useI18n } from "@/i18n";
import { getShopItemCopy } from "@/shop-items/copy";
import {
  PANEL_SPRING,
  getPanelItemMotion,
  usePanelMotion,
} from "@/styles/panelMotion";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons/chevron";
import {
  getSkinShopItems,
  isSkinShopItem,
  type SkinShopItem,
} from "@/shop-items/skins";
import { useQuestStore } from "@/store/core/quests/store";
import { getSkinPreview } from "@/components/bob/skins/previews";
import { BOB_SKINS, isBobSkinUnlocked } from "@/components/bob/skins/registry";
import { EyeIcon } from "@/icons/eye";
import { ShopCategoryIcon } from "@/icons/shopCategories";
import { mutedScrollSurface } from "@/styles/scrollSurface";
import thumbnails from "../../public/images/shop-items/manifest.json";
import { ShopThumbnailImage } from "@/components/ShopThumbnailImage";

type CatalogueItem = ShopItem | SkinShopItem;
type ShopTab = "hats" | "skins" | "accessories" | "effects" | "worlds";
const itemThumbnails: Record<string, string> = thumbnails.items;

export function ShopApp({
  onPreviewChange,
}: {
  onPreviewChange: (preview: boolean) => void;
}) {
  const panelMotion = usePanelMotion();
  const reducedMotion = useReducedMotion();
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const scrollPosition = useRef(0);
  const catalogueIsActive = useRef(true);
  const catalogueRef = useRef<HTMLDivElement>(null);
  const currentView = useViewStore((state) => state.currentView);
  const isTransitioning = useViewStore((state) => state.isTransitioning);
  const [activeTab, setActiveTab] = useState<ShopTab>(() => {
    try {
      const saved = localStorage.getItem("shop-category");
      return ["hats", "skins", "accessories", "effects", "worlds"].includes(saved ?? "") ? saved as ShopTab : "hats";
    } catch { return "hats"; }
  });
  useEffect(() => {
    try { localStorage.setItem("shop-category", activeTab); } catch { /* Selection remains usable without storage. */ }
  }, [activeTab]);
  const [categoryClicks, setCategoryClicks] = useState<
    Partial<Record<ShopTab, number>>
  >({});
  const { locale, messages } = useI18n();
  const isPresent = useIsPresent();
  const store = useCoreStore(
    useShallow((state) => ({
      bobItems: state.bobItems,
      tapEffects: state.tapEffects,
      worlds: state.worlds,
      bobSkinId: state.bobSkinId,
      purchasedBobSkinIds: state.purchasedBobSkinIds,
      resetPreview: state.resetPreview,
      previewBobSkin: state.previewBobSkin,
      previewWorld: state.previewWorld,
      previewTapEffect: state.previewTapEffect,
      previewBobItem: state.previewBobItem,
      canAfford: state.canAfford,
      // Only price threshold crossings affect catalogue actions, not every auto-tap.
      affordableCount: [
        ...state.bobItems,
        ...state.tapEffects,
        ...state.worlds,
        ...BOB_SKINS,
      ].filter((item) => state.taps >= (item.cost ?? 0)).length,
    })),
  );
  useQuestStore((state) =>
    BOB_SKINS.map((skin) =>
      isBobSkinUnlocked(skin, state.quests) ? "1" : "0",
    ).join(""),
  );
  const quests = useQuestStore.getState().quests;
  const { bobItems, tapEffects, worlds, resetPreview } = store;

  useEffect(() => {
    resetPreview();
    return () => {
      resetPreview();
    };
  }, [resetPreview]);

  useLayoutEffect(() => {
    onPreviewChange(previewItem !== null);
    return () => onPreviewChange(false);
  }, [previewItem, onPreviewChange]);

  useLayoutEffect(() => {
    const catalogue = catalogueRef.current;
    if (!catalogue || previewItem) return;
    catalogueIsActive.current = true;
    catalogue.scrollTop = scrollPosition.current;
    const update = () => updateScrollFades(catalogue);
    const observer = new ResizeObserver(update);
    observer.observe(catalogue);
    if (catalogue.firstElementChild)
      observer.observe(catalogue.firstElementChild);
    update();
    return () => observer.disconnect();
  }, [activeTab, previewItem]);

  useEffect(() => {
    if (!isPresent || isTransitioning) return;
    const view = useViewStore.getState();
    if (previewItem && currentView !== "shop:preview")
      view.transitionToView("shop:preview");
    else if (!previewItem && currentView === "shop:preview")
      view.transitionToView("phone:home");
  }, [previewItem, currentView, isTransitioning, isPresent]);

  const openPreview = (item: CatalogueItem) => {
    if (!previewItem)
      scrollPosition.current =
        catalogueRef.current?.scrollTop ?? scrollPosition.current;
    // popLayout keeps the old catalogue mounted during its exit. Ignore any
    // scroll events caused by that exiting layout so Back restores this offset.
    catalogueIsActive.current = false;
    if (isSkinShopItem(item)) store.previewBobSkin(item.skinId);
    else {
      resetPreview();
      if (activeTab === "worlds") store.previewWorld(item.id);
      else if (activeTab === "effects") store.previewTapEffect(item.id);
      else store.previewBobItem(item.id);
    }
    setPreviewItem(item.id);
  };

  const backToShop = () => {
    resetPreview();
    setPreviewItem(null);
  };

  const visibleBobItems = bobItems.filter((item) => item.unlocked !== false);
  const categories: Record<ShopTab, CatalogueItem[]> = {
    hats: visibleBobItems.filter((item) => item.type === "hat"),
    skins: getSkinShopItems(
      store.bobSkinId,
      quests,
      locale,
      store.purchasedBobSkinIds,
    ),
    accessories: visibleBobItems.filter((item) => item.type !== "hat"),
    effects: tapEffects,
    worlds,
  };
  const items = activeTab === "worlds" ? categories.worlds : [...categories[activeTab]].sort((a, b) => {
    if (isSkinShopItem(a) && isSkinShopItem(b) && a.questReward !== b.questReward) {
      return Number(a.questReward) - Number(b.questReward);
    }
    return a.cost - b.cost;
  });
  const preview = categories[activeTab].find((item) => item.id === previewItem);
  const stepPreview = (direction: -1 | 1) => {
    if (!preview || items.length < 2) return;
    const index = items.findIndex((item) => item.id === preview.id);
    openPreview(items[(index + direction + items.length) % items.length]);
  };

  const getItemActionProps = (item: CatalogueItem) => {
    if (isSkinShopItem(item)) {
      const label = !item.unlocked
        ? messages.shop.actions.locked
        : item.enabled
          ? messages.shop.actions.selected
          : item.purchased
            ? messages.shop.actions.equip
            : messages.shop.actions.purchase;
      return {
        $active: item.enabled,
        $variant: item.enabled
          ? ("dark" as const)
          : item.purchased
            ? ("muted" as const)
            : ("blue" as const),
        disabled:
          !item.unlocked ||
          item.enabled ||
          (!item.purchased && !store.canAfford(item.cost)),
        "aria-label": `${label}: ${item.name}`,
        "aria-pressed": item.enabled,
        children: label,
      };
    }
    const name = getShopItemCopy(item.id, locale)?.name ?? item.name;
    const label = item.enabled
      ? messages.shop.actions.selected
      : item.purchased
        ? messages.shop.actions.equip
        : messages.shop.actions.purchase;
    const canRemove = item.enabled && activeTab !== "worlds";
    const removeLabel =
      activeTab === "effects"
        ? messages.shop.actions.deactivate
        : messages.shop.actions.takeOff;
    return {
      $active: item.enabled,
      $variant: item.enabled
        ? ("dark" as const)
        : item.purchased
          ? ("muted" as const)
          : ("blue" as const),
      disabled:
        (!item.purchased && !store.canAfford(item.cost)) ||
        (item.enabled && activeTab === "worlds"),
      "aria-label": `${canRemove ? removeLabel : label}: ${name}`,
      "aria-pressed": item.purchased ? item.enabled : undefined,
      children: label,
    };
  };

  const handleItem = (item: CatalogueItem) => {
    if (isSkinShopItem(item)) {
      const current = useCoreStore.getState();
      if (!item.purchased) current.purchaseBobSkin(item.skinId);
      else current.setBobSkin(item.skinId);
      return useCoreStore.getState().bobSkinId === item.skinId;
    }
    // Read the current store so rapid repeated clicks cannot buy twice.
    const current = useCoreStore.getState();
    const source =
      activeTab === "effects"
        ? current.tapEffects
        : activeTab === "worlds"
          ? current.worlds
          : current.bobItems;
    const latest = source.find((entry) => entry.id === item.id);
    if (!latest || (!latest.purchased && !current.canAfford(latest.cost)))
      return false;

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

  return (
    <ShopRoot
      $preview={!!previewItem}
      aria-hidden={!isPresent}
      inert={!isPresent}
      data-shop-app
    >
      <AnimatePresence mode="popLayout" anchorY="bottom">
        {!previewItem ? (
          <ShopPanel
            key="shop-catalogue"
            role="dialog"
            aria-label={messages.navigation.shopLabel}
            aria-hidden={!isPresent}
            {...panelMotion}
          >
            <CatalogueFrame>
              <Catalogue
                key={activeTab}
                aria-label={messages.shop.tabs[activeTab]}
                data-shop-catalogue
                ref={catalogueRef}
                onScroll={(event) => {
                  if (!catalogueIsActive.current) return;
                  scrollPosition.current = event.currentTarget.scrollTop;
                  updateScrollFades(event.currentTarget);
                }}
              >
                <ItemGrid>
                  {items.map((item, index) => {
                    const name =
                      getShopItemCopy(item.id, locale)?.name ?? item.name;
                    return (
                      <ItemCard
                        key={item.id}
                        data-shop-item={item.id}
                        {...getPanelItemMotion(index, reducedMotion)}
                      >
                        <ItemMedia>
                          <Thumbnail
                            $active={item.enabled}
                            $owned={item.purchased}
                          >
                            <ShopThumbnailImage
                              src={
                                isSkinShopItem(item)
                                  ? getSkinPreview(item.skinId)
                                  : itemThumbnails[item.id]
                              }
                            />
                          </Thumbnail>
                          <ItemToolbar>
                            {!item.purchased &&
                              (isSkinShopItem(item) && !item.unlocked ? (
                                <LockedSkinTag
                                  title={messages.shop.actions.hiddenQuest}
                                >
                                  {messages.shop.actions.locked}
                                </LockedSkinTag>
                              ) : (
                                <PriceTag value={item.cost} />
                              ))}
                            <PreviewButton
                              type="button"
                              onClick={() => openPreview(item)}
                              aria-label={`${messages.shop.actions.preview}: ${name}`}
                              data-ui-sound-id="ui-tap"
                            >
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
                options={(
                  ["hats", "skins", "accessories", "effects", "worlds"] as const
                ).map((value) => ({
                  value,
                  label: (
                    <CategoryClickBounce
                      title={messages.shop.tabs[value]}
                      clickCount={categoryClicks[value] ?? 0}
                      reducedMotion={reducedMotion}
                    >
                      <ShopCategoryIcon category={value} />
                      <CategoryVisibleLabel aria-hidden="true">
                        {messages.shop.tabs[value]}
                      </CategoryVisibleLabel>
                      <CategoryLabel>{messages.shop.tabs[value]}</CategoryLabel>
                    </CategoryClickBounce>
                  ),
                }))}
                value={activeTab}
                onChange={(tab) => {
                  scrollPosition.current = 0;
                  setActiveTab(tab);
                  setCategoryClicks((previous) => ({
                    ...previous,
                    [tab]: (previous[tab] ?? 0) + 1,
                  }));
                }}
                layoutId="shop-categories"
                indicatorSize="content"
                animateOptions={false}
                fullWidth
              />
            </CategoryBar>
          </ShopPanel>
        ) : (
          <PreviewControls
            key="shop-preview-controls"
            role="group"
            aria-label={
              preview
                ? (getShopItemCopy(preview.id, locale)?.name ?? preview.name)
                : undefined
            }
            layout
            {...getPanelItemMotion(0, reducedMotion)}
          >
            {preview && (
              <>
                <PreviewPagination>
                  <PreviewNavButton
                    $variant="white"
                    type="button"
                    onClick={() => stepPreview(-1)}
                    disabled={items.length < 2}
                    aria-label={messages.shop.actions.previousItem}
                    data-ui-sound-id="ui-tap"
                  >
                    <ChevronLeftIcon />
                  </PreviewNavButton>
                  <PreviewDetails
                    layout
                    transition={PANEL_SPRING}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <PreviewNameTag
                      $variant="dark"
                      layout="position"
                      transition={PANEL_SPRING}
                    >
                      <span>
                        {getShopItemCopy(preview.id, locale)?.name ??
                          preview.name}
                      </span>
                      <span>
                        {
                          messages.shop.itemTypes[
                            preview.type as keyof typeof messages.shop.itemTypes
                          ]
                        }
                      </span>
                    </PreviewNameTag>
                    <AnimatePresence mode="popLayout" initial={false}>
                      {!preview.purchased && (
                        <motion.div
                          key="preview-price"
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={PANEL_SPRING}
                        >
                          {isSkinShopItem(preview) && !preview.unlocked ? (
                            <ItemStatusChip $variant="dark">
                              {messages.shop.actions.hiddenQuest}
                            </ItemStatusChip>
                          ) : (
                            <PriceTag value={preview.cost} />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </PreviewDetails>
                  <PreviewNavButton
                    $variant="white"
                    type="button"
                    onClick={() => stepPreview(1)}
                    disabled={items.length < 2}
                    aria-label={messages.shop.actions.nextItem}
                    data-ui-sound-id="ui-tap"
                  >
                    <ChevronRightIcon />
                  </PreviewNavButton>
                </PreviewPagination>
                <PreviewAction
                  {...getItemActionProps(preview)}
                  layout
                  type="button"
                  onClick={() => {
                    if (handleItem(preview)) resetPreview();
                  }}
                  data-ui-sound-id="ui-tap"
                />
              </>
            )}
            <Magnetic>
            <PreviewBackButton
              $variant="muted"
              {...getPanelItemMotion(1, reducedMotion)}
              type="button"
              onClick={backToShop}
              data-ui-sound-id="ui-tap-close"
            >
              {messages.shop.actions.backToShop}
            </PreviewBackButton>
            </Magnetic>
          </PreviewControls>
        )}
      </AnimatePresence>
    </ShopRoot>
  );
}

export function ShopBalance() {
  const taps = useCoreStore((state) => Math.floor(state.taps));
  return <PriceTag value={taps} />;
}

function updateScrollFades(element: HTMLDivElement) {
  const frame = element.parentElement;
  frame?.style.setProperty(
    "--scroll-top-opacity",
    String(Math.min(1, Math.max(0, element.scrollTop) / 22)),
  );
  frame?.style.setProperty(
    "--scroll-bottom-opacity",
    String(
      Math.min(
        1,
        Math.max(
          0,
          element.scrollHeight - element.clientHeight - element.scrollTop,
        ) / 22,
      ),
    ),
  );
}

const ShopRoot = styled.div<{ $preview: boolean }>`
  position: relative;
  width: ${({ $preview }) =>
    $preview
      ? "min(480px, calc(100vw - 56px))"
      : "min(42.75rem, calc(100vw - 48px))"};
  max-width: 100%;
  color: #212121;
  &[aria-hidden="true"],
  &[aria-hidden="true"] * {
    pointer-events: none !important;
  }
`;

const ShopScreen = forwardRef<
  HTMLDivElement,
  ComponentProps<typeof motion.div>
>(function ShopScreen(props, ref) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      {...props}
      ref={ref}
      aria-hidden={!isPresent}
      inert={!isPresent}
    />
  );
});

const ShopPanel = styled(ShopScreen)`
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 4px;
  border-radius: 24px;
  background: transparent;
  color: #212121;
  max-height: calc(100dvh - 164px);
  pointer-events: auto;
  transform-origin: bottom center;
  &[aria-hidden="true"],
  &[aria-hidden="true"] * {
    pointer-events: none !important;
  }
`;

const CatalogueFrame = styled.div`
  ${mutedScrollSurface}
  --catalogue-color: var(--muted-scroll-color);
  position: relative;
  isolation: isolate;
  min-height: 0;
  display: flex;
  overflow: hidden;
  border-radius: 24px;
  background: var(--catalogue-color);
  &::before,
  &::after {
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
  > button {
    margin-left: auto;
  }
`;
const Thumbnail = styled.div<{ $active: boolean; $owned: boolean }>`
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: ${({ $active }) =>
    $active ? "radial-gradient(circle, #fff 0%, #D0CEDD 70%)" : "#D0CEDD"};
  &::after {
    content: ${({ $active }) => ($active ? '""' : "none")};
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
    filter: ${({ $owned }) => ($owned ? "none" : "grayscale(1)")};
    opacity: ${({ $owned }) => ($owned ? 1 : 0.5)};
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
    border: 2px solid ${({ $active }) => ($active ? "#fff" : "transparent")};
    border-radius: 18px;
    pointer-events: none;
  }
  &:disabled {
    opacity: ${({ $active }) => ($active ? 1 : 0.25)};
    cursor: default;
  }
  &:focus-visible {
    outline: 3px solid #212026;
    outline-offset: 7px;
  }
`;
function CategoryClickBounce({
  clickCount,
  reducedMotion,
  title,
  children,
}: {
  clickCount: number;
  reducedMotion: boolean | null;
  title: string;
  children: ReactNode;
}) {
  const controls = useAnimationControls();
  const previousClickCount = useRef(clickCount);
  useEffect(() => {
    controls.stop();
    const clicked = previousClickCount.current !== clickCount;
    previousClickCount.current = clickCount;
    controls.set({ scale: 1, y: 0 });
    if (!clicked || reducedMotion) return;
    void controls.start({
      scale: [1, 1.08, 1],
      y: [0, -3, 0],
      transition: { duration: 0.32, ease: "easeInOut" },
    });
    return () => controls.stop();
  }, [clickCount, reducedMotion, controls]);
  return (
    <CategoryIconLabel title={title} initial={false} animate={controls}>
      {children}
    </CategoryIconLabel>
  );
}

const CategoryIconLabel = styled(motion.span)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  svg {
    flex-shrink: 0;
  }
`;
const CategoryVisibleLabel = styled.span`
  display: inline-block;
  font-size: 14px;
  white-space: nowrap;
  color: #212121;
  transition: color 0.12s ease-out;
  button[aria-pressed="false"] & {
    color: rgba(33, 33, 33, 0.4);
  }
  @media (width < 768px) {
    display: none;
  }
`;
const CategoryLabel = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
const CategoryBar = styled.div`
  width: 100%;
  max-width: 100%;
  button {
    overflow: hidden;
  }
  svg {
    display: block;
    opacity: 1;
    transition: opacity 0.12s ease-out;
  }
  button[aria-pressed="false"] svg {
    opacity: 0.4;
  }

  flex-shrink: 0;
  > div {
    background: #eae9ee;
  }
  @media (max-width: 560px) {
    button {
      padding-inline: 4px;
      font-size: 0.8rem;
    }
  }
`;

const LockedSkinTag = styled.span`
  padding: 4px 7px;
  border-radius: 10px;
  background: #212026;
  color: white;
  font-size: 11px;
  font-weight: 800;
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
  &:hover {
    background: rgba(33, 32, 38, 0.85);
  }
  &:active {
    transform: scale(0.92);
  }
  &:focus-visible {
    outline: 2px solid #4178f7;
    outline-offset: 3px;
  }
`;
const PreviewControls = styled(ShopScreen)`
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
  > div {
    flex-shrink: 0;
  }
`;
const PreviewNameTag = styled(ItemStatusChip)`
  min-width: 0;
  max-width: 100%;
  height: auto;
  min-height: 1.375rem;
  span:first-child {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  span:last-child {
    flex-shrink: 0;
    white-space: nowrap;
  }
`;
const PreviewAction = styled(ItemAction)`
  width: min(240px, 100%);
`;
const PreviewBackButton = styled(FloatingActionButton)`
  width: fit-content; height: 3rem; padding: 0.5rem 20px; border-radius: 50px;
`;
