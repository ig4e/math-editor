import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Island } from "../Island";
import { atom, useSetAtom } from "../../editor-jotai";
import type { SidebarProps, SidebarPropsContextValue } from "./common";
import { SidebarPropsContext } from "./common";
import { SidebarHeader } from "./SidebarHeader";
import clsx from "clsx";
import { useDevice, useExcalidrawSetAppState } from "../App";
import { updateObject } from "../../utils";
import { KEYS } from "../../keys";
import { EVENT } from "../../constants";
import { SidebarTrigger } from "./SidebarTrigger";
import { SidebarTabTriggers } from "./SidebarTabTriggers";
import { SidebarTabTrigger } from "./SidebarTabTrigger";
import { SidebarTabs } from "./SidebarTabs";
import { SidebarTab } from "./SidebarTab";
import { useUIAppState } from "../../context/ui-appState";
import { useOutsideClick } from "../../hooks/useOutsideClick";

import "./Sidebar.scss";

/**
 * Flags whether the currently rendered Sidebar is docked or not, for use
 * in upstream components that need to act on this (e.g. LayerUI to shift the
 * UI). We use an atom because of potential host app sidebars (for the default
 * sidebar we could just read from appState.defaultSidebarDockedPreference).
 *
 * Since we can only render one Sidebar at a time, we can use a simple flag.
 */
export const isSidebarDockedAtom = atom(false);

export const SidebarInner = forwardRef(
  (
    {
      name,
      children,
      onDock,
      docked,
      className,
      onResize,
      minWidth = 280,
      maxWidth = 800,
      ...rest
    }: SidebarProps & Omit<React.RefAttributes<HTMLDivElement>, "onSelect">,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    if (import.meta.env.DEV && onDock && docked == null) {
      console.warn(
        "Sidebar: `docked` must be set when `onDock` is supplied for the sidebar to be user-dockable. To hide this message, either pass `docked` or remove `onDock`",
      );
    }

    const setAppState = useExcalidrawSetAppState();

    const setIsSidebarDockedAtom = useSetAtom(isSidebarDockedAtom);

    useLayoutEffect(() => {
      setIsSidebarDockedAtom(!!docked);
      return () => {
        setIsSidebarDockedAtom(false);
      };
    }, [setIsSidebarDockedAtom, docked]);

    const headerPropsRef = useRef<SidebarPropsContextValue>(
      {} as SidebarPropsContextValue,
    );
    headerPropsRef.current.onCloseRequest = () => {
      setAppState({ openSidebar: null });
    };
    headerPropsRef.current.onDock = (isDocked) => onDock?.(isDocked);
    // renew the ref object if the following props change since we want to
    // rerender. We can't pass down as component props manually because
    // the <Sidebar.Header/> can be rendered upstream.
    headerPropsRef.current = updateObject(headerPropsRef.current, {
      docked,
      // explicit prop to rerender on update
      shouldRenderDockButton: !!onDock && docked != null,
    });

    const islandRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => {
      return islandRef.current!;
    });

    const device = useDevice();

    const closeLibrary = useCallback(() => {
      const isDialogOpen = !!document.querySelector(".Dialog");

      // Prevent closing if any dialog is open
      if (isDialogOpen) {
        return;
      }
      setAppState({ openSidebar: null });
    }, [setAppState]);

    useOutsideClick(
      islandRef,
      useCallback(
        (event) => {
          // If click on the library icon, do nothing so that LibraryButton
          // can toggle library menu
          if ((event.target as Element).closest(".sidebar-trigger")) {
            return;
          }
          if (!docked || !device.editor.canFitSidebar) {
            closeLibrary();
          }
        },
        [closeLibrary, docked, device.editor.canFitSidebar],
      ),
    );

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === KEYS.ESCAPE &&
          (!docked || !device.editor.canFitSidebar)
        ) {
          closeLibrary();
        }
      };
      document.addEventListener(EVENT.KEYDOWN, handleKeyDown);
      return () => {
        document.removeEventListener(EVENT.KEYDOWN, handleKeyDown);
      };
    }, [closeLibrary, docked, device.editor.canFitSidebar]);

    // math-editor fork: optional drag handle on the sidebar's left edge.
    // We track drag state in a closure on the handle's pointerdown so we
    // don't need extra renders during drag.
    const handlePointerDown = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (!onResize) return;
        event.preventDefault();
        const island = islandRef.current;
        if (!island) return;
        const startX = event.clientX;
        const startWidth = island.getBoundingClientRect().width;
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        target.classList.add("sidebar__resize-handle--dragging");

        const onMove = (e: PointerEvent) => {
          const delta = startX - e.clientX;
          const next = Math.max(
            minWidth,
            Math.min(maxWidth, Math.round(startWidth + delta)),
          );
          onResize(next);
        };
        const onUp = () => {
          target.releasePointerCapture(event.pointerId);
          target.classList.remove("sidebar__resize-handle--dragging");
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      },
      [onResize, minWidth, maxWidth],
    );

    return (
      <Island
        {...rest}
        className={clsx("sidebar", { "sidebar--docked": docked }, className)}
        ref={islandRef}
      >
        {onResize && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            className="sidebar__resize-handle"
            onPointerDown={handlePointerDown}
          />
        )}
        <SidebarPropsContext.Provider value={headerPropsRef.current}>
          {children}
        </SidebarPropsContext.Provider>
      </Island>
    );
  },
);
SidebarInner.displayName = "SidebarInner";

export const Sidebar = Object.assign(
  forwardRef((props: SidebarProps, ref: React.ForwardedRef<HTMLDivElement>) => {
    const appState = useUIAppState();

    const { onStateChange } = props;

    const refPrevOpenSidebar = useRef(appState.openSidebar);
    useEffect(() => {
      if (
        // closing sidebar
        ((!appState.openSidebar &&
          refPrevOpenSidebar?.current?.name === props.name) ||
          // opening current sidebar
          (appState.openSidebar?.name === props.name &&
            refPrevOpenSidebar?.current?.name !== props.name) ||
          // switching tabs or switching to a different sidebar
          refPrevOpenSidebar.current?.name === props.name) &&
        appState.openSidebar !== refPrevOpenSidebar.current
      ) {
        onStateChange?.(
          appState.openSidebar?.name !== props.name
            ? null
            : appState.openSidebar,
        );
      }
      refPrevOpenSidebar.current = appState.openSidebar;
    }, [appState.openSidebar, onStateChange, props.name]);

    const [mounted, setMounted] = useState(false);
    useLayoutEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // We want to render in the next tick (hence `mounted` flag) so that it's
    // guaranteed to happen after unmount of the previous sidebar (in case the
    // previous sidebar is mounted after the next one). This is necessary to
    // prevent flicker of subcomponents that support fallbacks
    // (e.g. SidebarHeader). This is because we're using flags to determine
    // whether prefer the fallback component or not (otherwise both will render
    // initially), and the flag won't be reset in time if the unmount order
    // it not correct.
    //
    // Alternative, and more general solution would be to namespace the fallback
    // HoC so that state is not shared between subcomponents when the wrapping
    // component is of the same type (e.g. Sidebar -> SidebarHeader).
    const shouldRender = mounted && appState.openSidebar?.name === props.name;

    if (!shouldRender) {
      return null;
    }

    return <SidebarInner {...props} ref={ref} key={props.name} />;
  }),
  {
    Header: SidebarHeader,
    TabTriggers: SidebarTabTriggers,
    TabTrigger: SidebarTabTrigger,
    Tabs: SidebarTabs,
    Tab: SidebarTab,
    Trigger: SidebarTrigger,
  },
);
Sidebar.displayName = "Sidebar";
