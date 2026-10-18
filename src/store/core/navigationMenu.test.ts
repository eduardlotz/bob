import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as wait } from "node:timers/promises";
import { createStore } from "zustand/vanilla";
import { createNavigationMenuState, MENU_CLOSE_DURATION_MS, type NavigationMenuState } from "./navigationMenu";
import { connectNavigationMenu } from "./navigationMenuController";

const createMenu = () => createStore<NavigationMenuState>(createNavigationMenuState);

describe("navigation menu lifecycle", () => {
  test("a fresh opening never enters the closing state", () => {
    const store = createMenu();
    const states: boolean[] = [];
    store.subscribe(state => states.push(state.isOptionsClosing));
    store.getState().openOptions();
    assert.equal(store.getState().showOptions, true);
    assert.deepEqual(states, [false]);
  });

  test("reopening cancels the previous close callback", async () => {
    const store = createMenu();
    store.getState().openOptions();
    store.getState().closeOptionsWithAnimation();
    store.getState().openOptions();
    await wait(MENU_CLOSE_DURATION_MS + 20);
    assert.equal(store.getState().showOptions, true);
    assert.equal(store.getState().isOptionsClosing, false);
  });

  test("duplicate close requests do not restart the exit", async () => {
    const store = createMenu();
    const states: boolean[] = [];
    store.getState().openOptions();
    store.subscribe(state => states.push(state.showOptions));
    store.getState().closeOptionsWithAnimation();
    store.getState().closeOptionsWithAnimation();
    await wait(MENU_CLOSE_DURATION_MS + 20);
    assert.deepEqual(states, [true, false]);
    assert.equal(store.getState().isOptionsClosing, false);
  });

  test("toggling during an exit reverses it and stays open", async () => {
    const store = createMenu();
    store.getState().toggleOptions();
    store.getState().toggleOptions();
    store.getState().toggleOptions();
    await wait(MENU_CLOSE_DURATION_MS + 20);
    assert.equal(store.getState().showOptions, true);
    assert.equal(store.getState().isOptionsClosing, false);
  });

  test("an immediate close resets the exit state and cancels its callback", async () => {
    const store = createMenu();
    store.getState().openOptions();
    store.getState().closeOptionsWithAnimation();
    store.getState().setShowOptions(false);
    assert.equal(store.getState().isOptionsClosing, false);
    store.getState().openOptions();
    await wait(MENU_CLOSE_DURATION_MS + 20);
    assert.equal(store.getState().showOptions, true);
  });

  test("closing an already hidden menu is a no-op", () => {
    const store = createMenu();
    const initial = store.getState();
    store.getState().closeOptionsWithAnimation();
    assert.equal(store.getState(), initial);
  });

  test("keeps the menu camera until the exit has finished", async () => {
    const menu = createMenu();
    const view = createStore<{ currentView: string; resetToDefaultView: () => void }>(set => ({
      currentView: "navigation",
      resetToDefaultView: () => set({ currentView: "default" }),
    }));
    const disconnect = connectNavigationMenu(menu, view);
    menu.getState().openOptions();
    menu.getState().closeOptionsWithAnimation();
    assert.equal(view.getState().currentView, "navigation");
    await wait(MENU_CLOSE_DURATION_MS + 20);
    assert.equal(menu.getState().showOptions, false);
    assert.equal(view.getState().currentView, "default");
    disconnect();
  });

  test("an exit never resets a newly selected phone view", async () => {
    const menu = createMenu();
    const view = createStore<{ currentView: string; resetToDefaultView: () => void }>(set => ({
      currentView: "navigation",
      resetToDefaultView: () => set({ currentView: "default" }),
    }));
    const disconnect = connectNavigationMenu(menu, view);
    menu.getState().openOptions();
    view.setState({ currentView: "phone:home" });
    assert.equal(menu.getState().isOptionsClosing, true);
    await wait(MENU_CLOSE_DURATION_MS + 20);
    assert.equal(menu.getState().showOptions, false);
    assert.equal(view.getState().currentView, "phone:home");
    disconnect();
  });
});
