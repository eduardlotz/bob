import { FloatingBar } from "@/layout/FloatingBar";
import { useFloatingBar } from "@/layout/FloatingBar";
import type { MiniGameType } from "@/store/minigames";
import type { ComponentType, ReactNode } from "react";

export type SupportedMiniGameType = Exclude<MiniGameType, "LOBBY" | "FOOTBALL">;

interface MiniGameItemDecoratorProps {
  children: ReactNode;
  label: string;
  game: SupportedMiniGameType;
  onSelect: (game: SupportedMiniGameType) => void;
}

const MiniGameItemContent = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);

export function withMiniGameItem<TProps extends { children: ReactNode }>(
  WrappedComponent: ComponentType<TProps>,
) {
  const MiniGameItem = ({
    label,
    game,
    onSelect,
    ...props
  }: TProps & MiniGameItemDecoratorProps) => {
    const { setHoveredObject } = useFloatingBar();

    const handlePointerOut = () => {
      setHoveredObject(null);
    };

    const handleSelect = () => {
      setHoveredObject(null);
      onSelect(game);
    };

    return (
      <FloatingBar title={label}>
        <group onPointerOut={handlePointerOut} onClick={handleSelect}>
          <WrappedComponent {...(props as TProps)} />
        </group>
      </FloatingBar>
    );
  };

  MiniGameItem.displayName = `withMiniGameItem(${
    WrappedComponent.displayName ?? WrappedComponent.name ?? "AnonymousComponent"
  })`;

  return MiniGameItem;
}

export const MiniGameItem = withMiniGameItem(MiniGameItemContent);
