// React module augmentation, isolated from global.d.ts so the latter
// stays a script (global scope). Allowing `--*` keys in inline style
// objects covers every site in the package that uses CSS custom
// properties (ColorPicker, Island, Modal, Stack, …).

import "react";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
