import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { ROUTE_PATHS } from "@/store/config/routes";
import { useIsHydrated, useMessageStore } from "@/store/messageStore";
import { useCoreStore } from "@/store/core/store";
import { useLocaleStore } from "@/i18n";

type ScheduledStep = {
  delayMs: number;
  getMessageId: () => string | null;
  requirement?: () => boolean;
  subscribeToRequirement?: (onChange: () => void) => () => void;
};

const HOME_ENTRY_DELAY_MS = 2400;
const HOME_WELCOME_MESSAGE_ID = "welcome_home_v3";
const ABOUT_WELCOME_MESSAGE_ID = "about_welcome_v3";
const PORTFOLIO_WELCOME_MESSAGE_ID = "portfolio_welcome_v3";
const MINIGAMES_WELCOME_MESSAGE_ID = "minigames_welcome_v3";
const RETURN_SHOP_AFFORDABLE_MESSAGE_ID = "return_shop_affordable";
const HOME_RETURN_GREETING_IDS = [
  "return_greeting_1",
  "return_greeting_2",
  "return_greeting_3",
  "return_greeting_4",
  "return_greeting_5",
  "return_greeting_6",
  "return_greeting_7",
  "return_greeting_8",
] as const;

const pickRandomHomeGreeting = () => {
  const { seenThisSession } = useMessageStore.getState();
  const available = HOME_RETURN_GREETING_IDS.filter(
    (id) => !seenThisSession[id],
  );
  return available.length
    ? available[Math.floor(Math.random() * available.length)]
    : null;
};

const hasAffordablePurchaseOption = () => {
  const { taps, bobItems, tapEffects, worlds } = useCoreStore.getState();

  const purchasableItems = [
    ...bobItems.filter((item) => item.unlocked !== false),
    ...tapEffects.filter((item) => item.unlocked !== false),
    ...worlds.filter((item) => item.unlocked !== false),
  ];

  return purchasableItems.some((item) => !item.purchased && item.cost <= taps);
};

const shouldShowAffordableShopHint = () => {
  const state = useMessageStore.getState();
  const alreadySeenPersisted =
    state.repeatFlags[RETURN_SHOP_AFFORDABLE_MESSAGE_ID] === true;
  const currentlyActive =
    state.activeMessage?.config.id === RETURN_SHOP_AFFORDABLE_MESSAGE_ID;
  const alreadyQueued = state.queue.some(
    (item) => item.id === RETURN_SHOP_AFFORDABLE_MESSAGE_ID,
  );
  if (
    alreadySeenPersisted ||
    currentlyActive ||
    alreadyQueued
  ) {
    return false;
  }

  return hasAffordablePurchaseOption();
};

const SCENE_MESSAGE_STEPS: Partial<Record<string, ScheduledStep[]>> = {
  [ROUTE_PATHS.HOME]: [
    {
      delayMs: HOME_ENTRY_DELAY_MS,
      getMessageId: () => {
        const hasSeenWelcome =
          !!useMessageStore.getState().repeatFlags[HOME_WELCOME_MESSAGE_ID];

        if (!hasSeenWelcome) {
          return HOME_WELCOME_MESSAGE_ID;
        }

        if (shouldShowAffordableShopHint()) {
          return RETURN_SHOP_AFFORDABLE_MESSAGE_ID;
        }

        return pickRandomHomeGreeting();
      },
    },
    {
      delayMs: 1000,
      getMessageId: () => "first_tap_hint",
      requirement: () => useCoreStore.getState().manualTaps >= 10,
      subscribeToRequirement: (onChange) =>
        useCoreStore.subscribe(() => {
          onChange();
        }),
    },
    {
      delayMs: HOME_ENTRY_DELAY_MS,
      getMessageId: () =>
        shouldShowAffordableShopHint()
          ? RETURN_SHOP_AFFORDABLE_MESSAGE_ID
          : null,
      requirement: hasAffordablePurchaseOption,
      subscribeToRequirement: (onChange) =>
        useCoreStore.subscribe(() => {
          onChange();
        }),
    },
  ],
  [ROUTE_PATHS.ABOUT]: [
    {
      delayMs: 1800,
      getMessageId: () => ABOUT_WELCOME_MESSAGE_ID,
    },
  ],
  [ROUTE_PATHS.PORTFOLIO]: [
    {
      delayMs: 1800,
      getMessageId: () => PORTFOLIO_WELCOME_MESSAGE_ID,
    },
  ],
  [ROUTE_PATHS.MINIGAMES]: [
    {
      delayMs: 1800,
      getMessageId: () => MINIGAMES_WELCOME_MESSAGE_ID,
    },
  ],
};

export function useMessageSystem() {
  const currentRoute = useAppStore((s) => s.currentRoute);
  const isHydrated = useIsHydrated();
  const isReady = useCoreStore((state) => state.isReady);
  const showMessage = useMessageStore((state) => state.showMessage);
  const locale = useLocaleStore((state) => state.locale);
  const previousLocaleRef = useRef(locale);
  const hasInitializedHydrationRef = useRef(false);
  const lastRouteRef = useRef<string | null>(null);
  const scheduledTimeoutsRef = useRef<number[]>([]);
  const scheduledCleanupRef = useRef<Array<() => void>>([]);

  const clearScheduledTimeouts = useCallback(() => {
    scheduledTimeoutsRef.current.forEach((timeout) =>
      window.clearTimeout(timeout),
    );
    scheduledTimeoutsRef.current = [];

    scheduledCleanupRef.current.forEach((cleanup) => cleanup());
    scheduledCleanupRef.current = [];
  }, []);

  const scheduleSteps = useCallback(
    (route: string, steps: ScheduledStep[]) => {
      clearScheduledTimeouts();

      steps.forEach(
        ({
          delayMs,
          getMessageId,
          requirement,
          subscribeToRequirement,
        }) => {
          let stopped = false;
          let unsubscribeRequirement: (() => void) | null = null;
          let retryTimeout: number | null = null;

          const stop = () => {
            if (stopped) return;
            stopped = true;
            if (retryTimeout !== null) window.clearTimeout(retryTimeout);
            unsubscribeRequirement?.();
          };

          const tryStep = () => {
            if (stopped) return;
            if (useAppStore.getState().currentRoute !== route) {
              stop();
              return;
            }
            const messageState = useMessageStore.getState();
            if (!messageState.isHydrated || messageState.systemPaused) {
              if (retryTimeout !== null) window.clearTimeout(retryTimeout);
              retryTimeout = window.setTimeout(tryStep, 500);
              return;
            }
            if (requirement && !requirement()) return;

            const messageId = getMessageId();
            stop();
            if (messageId) void showMessage(messageId);
          };

          const timeout = window.setTimeout(() => {
            if (subscribeToRequirement) {
              unsubscribeRequirement = subscribeToRequirement(tryStep);
            }
            tryStep();
          }, delayMs);

          scheduledTimeoutsRef.current.push(timeout);
          scheduledCleanupRef.current.push(stop);
        },
      );
    },
    [clearScheduledTimeouts, showMessage],
  );

  const handleRouteChange = useCallback(
    (route: string) => {
      const steps = SCENE_MESSAGE_STEPS[route] ?? [];
      scheduleSteps(route, steps);
    },
    [scheduleSteps],
  );

  useEffect(() => {
    if (!currentRoute || !isHydrated || !isReady) return;
    if (currentRoute === lastRouteRef.current) return;
    lastRouteRef.current = currentRoute;
    handleRouteChange(currentRoute);
  }, [currentRoute, handleRouteChange, isHydrated, isReady]);

  useEffect(() => {
    return () => {
      clearScheduledTimeouts();
    };
  }, [clearScheduledTimeouts]);

  useEffect(() => {
    if (!isHydrated) return;

    if (!hasInitializedHydrationRef.current) {
      hasInitializedHydrationRef.current = true;
      previousLocaleRef.current = locale;
      return;
    }

    if (previousLocaleRef.current === locale) {
      return;
    }

    previousLocaleRef.current = locale;
    lastRouteRef.current = null;
    clearScheduledTimeouts();
    useMessageStore.setState({ activeMessage: null, queue: [] });

    if (!currentRoute || !isReady) return;

    lastRouteRef.current = currentRoute;
    handleRouteChange(currentRoute);
  }, [
    clearScheduledTimeouts,
    currentRoute,
    handleRouteChange,
    isHydrated,
    isReady,
    locale,
  ]);
}
