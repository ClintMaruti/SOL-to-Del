/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOY_ENV?: string;
}

declare module "*.svg?react" {
  import { FC, SVGProps } from "react";

  const content: FC<SVGProps<SVGSVGElement>>;
  export default content;
}
