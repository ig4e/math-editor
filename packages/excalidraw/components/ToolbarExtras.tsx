// Host-injected slot that lands at the end of the top-center shape
// toolbar (after the extra-tools dropdown). Children render with the
// same chrome as the built-in shape tools because the tunnel
// drops them inside the existing Island.
//
// Use Excalidraw's exported `ToolButton` for child buttons so they
// look identical to selection / rectangle / arrow / etc.

import { useTunnels } from "../context/tunnels";

const ToolbarExtras = ({ children }: { children?: React.ReactNode }) => {
  const { ToolbarExtrasTunnel } = useTunnels();
  return <ToolbarExtrasTunnel.In>{children}</ToolbarExtrasTunnel.In>;
};

export default ToolbarExtras;
ToolbarExtras.displayName = "ToolbarExtras";
