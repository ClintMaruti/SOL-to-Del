/**
 * Release flags: control feature visibility by deploy environment.
 * Base is all enabled; only falsy overrides are listed per env.
 * Production blocks every gated release (all ReleaseIds from DESTINATIONS_SUB_PAGES).
 * ReleaseId is derived from DESTINATIONS_SUB_PAGES config.
 */

import { DESTINATIONS_SUB_PAGES } from "@/config/destinations-sub-pages.config";

export type DeployEnv = "development" | "test" | "staging" | "production";

export type ReleaseId = (typeof DESTINATIONS_SUB_PAGES)[number]["releaseId"];

const RELEASE_IDS: ReleaseId[] = DESTINATIONS_SUB_PAGES.map((s) => s.releaseId);

const productionAllBlocked = Object.fromEntries(
  RELEASE_IDS.map((id) => [id, false])
) as Record<ReleaseId, boolean>;

/** Env-specific overrides. Base is all true; only falsy values need to be set. */
const envOverrides: Partial<
  Record<DeployEnv, Partial<Record<ReleaseId, boolean>>>
> = {
  production: productionAllBlocked,
};

function buildReleaseFlagsByEnv(): Record<
  DeployEnv,
  Record<ReleaseId, boolean>
> {
  const base = Object.fromEntries(
    RELEASE_IDS.map((id) => [id, true])
  ) as Record<ReleaseId, boolean>;

  const envs: DeployEnv[] = ["development", "test", "staging", "production"];
  return Object.fromEntries(
    envs.map((env) => [env, { ...base, ...envOverrides[env] }])
  ) as Record<DeployEnv, Record<ReleaseId, boolean>>;
}

const releaseFlagsByEnv = buildReleaseFlagsByEnv();

/**
 * Get current deploy environment from VITE_DEPLOY_ENV.
 * Falls back to 'development' when unset or in dev mode.
 */
export function getDeployEnv(): DeployEnv {
  const raw = import.meta.env.VITE_DEPLOY_ENV;
  if (
    raw === "development" ||
    raw === "test" ||
    raw === "staging" ||
    raw === "production"
  ) {
    return raw;
  }
  return import.meta.env.DEV ? "development" : "test";
}

/**
 * Check if a release is enabled for the current deploy environment.
 * Unknown ids (e.g. agency-groups) are treated as no flag and return true.
 */
export function isReleaseEnabled(releaseId: ReleaseId): boolean {
  if (!RELEASE_IDS.includes(releaseId as ReleaseId)) {
    return true;
  }
  const env = getDeployEnv();
  const flags = releaseFlagsByEnv[env];
  return flags[releaseId as ReleaseId] ?? true;
}
