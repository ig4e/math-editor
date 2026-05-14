import type { JSX } from "react";
import React from "react";
import type { AppState, SidebarName, SidebarTabName } from "../../types";

export type SidebarTriggerProps = {
  name: SidebarName;
  tab?: SidebarTabName;
  icon?: JSX.Element;
  children?: React.ReactNode;
  title?: string;
  className?: string;
  onToggle?: (open: boolean) => void;
  style?: React.CSSProperties;
};

export type SidebarProps<P = {}> = {
  name: SidebarName;
  children: React.ReactNode;
  /**
   * Called on sidebar open/close or tab change.
   */
  onStateChange?: (state: AppState["openSidebar"]) => void;
  /**
   * supply alongside `docked` prop in order to make the Sidebar user-dockable
   */
  onDock?: (docked: boolean) => void;
  docked?: boolean;
  className?: string;
  /**
   * math-editor fork: if provided, the sidebar renders a drag handle on
   * its left edge. The handle calls this with the new px width during
   * drag — host owns the width state and threads it back via the
   * `sidebarWidth` prop on <Excalidraw>.
   */
  onResize?: (widthPx: number) => void;
  /** Minimum width the resize handle will report. */
  minWidth?: number;
  /** Maximum width the resize handle will report. */
  maxWidth?: number;
  // NOTE sidebars we use internally inside the editor must have this flag set.
  // It indicates that this sidebar should have lower precedence over host
  // sidebars, if both are open.
  /** @private internal */
  __fallback?: boolean;
} & P;

export type SidebarPropsContextValue = Pick<
  SidebarProps,
  "onDock" | "docked"
> & { onCloseRequest: () => void; shouldRenderDockButton: boolean };

export const SidebarPropsContext =
  React.createContext<SidebarPropsContextValue>({} as SidebarPropsContextValue);
