import "react-i18next";
import common from "./locales/en/common.json";
import admin from "./locales/en/admin.json";
import client from "./locales/en/client.json";

declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof common;
      admin: typeof admin;
      client: typeof client;
    };
  }
}
