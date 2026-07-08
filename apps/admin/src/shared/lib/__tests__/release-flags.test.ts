import { afterEach, describe, expect, it, vi } from "vitest";

import { getDeployEnv, isReleaseEnabled } from "../release-flags";

describe("release-flags", () => {
  describe("getDeployEnv", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("returns value from VITE_DEPLOY_ENV when set to a valid env", () => {
      vi.stubEnv("VITE_DEPLOY_ENV", "staging");
      expect(getDeployEnv()).toBe("staging");
    });

    it("returns development when VITE_DEPLOY_ENV is unset and DEV is true", () => {
      vi.stubEnv("VITE_DEPLOY_ENV", undefined);
      vi.stubEnv("DEV", true);
      expect(getDeployEnv()).toBe("development");
    });

    it("returns test when VITE_DEPLOY_ENV is unset and DEV is false", () => {
      vi.stubEnv("VITE_DEPLOY_ENV", undefined);
      vi.stubEnv("DEV", false);
      expect(getDeployEnv()).toBe("test");
    });
  });

  describe("isReleaseEnabled", () => {
    it("returns boolean for known release id", () => {
      expect(typeof isReleaseEnabled("agents")).toBe("boolean");
    });
  });
});
