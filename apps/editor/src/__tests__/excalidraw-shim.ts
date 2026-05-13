// Test-only stub for @excalidraw/excalidraw — keeps the heavy lib out
// of unit tests. Components that render the real <Excalidraw> are
// covered by manual smoke checks per the verification gate.

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

const Stub = ({ children }: React.PropsWithChildren) =>
  React.createElement('div', { 'data-stub': true }, children);
const Empty = () => null;

export const Excalidraw = Stub;
export const Footer = Stub;
export const convertToExcalidrawElements = () => [];
export const sceneCoordsToViewportCoords = ({ sceneX, sceneY }: { sceneX: number; sceneY: number }) =>
  ({ x: sceneX, y: sceneY });

export const MainMenu: any = Stub;
MainMenu.Item = Stub;
MainMenu.Separator = Empty;
MainMenu.DefaultItems = new Proxy({}, { get: () => Empty });

export const WelcomeScreen: any = Stub;
WelcomeScreen.Center = new Proxy({}, { get: () => Empty });
WelcomeScreen.Hints = new Proxy({}, { get: () => Empty });
