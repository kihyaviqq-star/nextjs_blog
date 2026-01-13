import { HeaderClient } from "./header-client";
import { SiteLogoServer } from "./site-logo-server";

export function Header() {
  return <HeaderClient logo={<SiteLogoServer />} />;
}
