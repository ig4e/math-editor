// Host-injected slot rendered inside `.layer-ui__wrapper__footer-left`,
// to the right of the zoom / undo Island. Use this when a status strip
// or tool cluster needs to sit vertically aligned with the native
// bottom-left pills rather than floating in the page center.

import { useTunnels } from "../../context/tunnels";

const FooterLeft = ({ children }: { children?: React.ReactNode }) => {
  const { FooterLeftTunnel } = useTunnels();
  return <FooterLeftTunnel.In>{children}</FooterLeftTunnel.In>;
};

export default FooterLeft;
FooterLeft.displayName = "FooterLeft";
