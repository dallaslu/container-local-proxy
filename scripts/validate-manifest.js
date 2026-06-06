"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
const requiredPermissions = new Set(["proxy", "storage", "contextualIdentities", "webRequest", "webRequestBlocking"]);

for (const permission of requiredPermissions) {
  if (!manifest.permissions.includes(permission)) {
    throw new Error(`Missing required permission: ${permission}`);
  }
}

for (const script of manifest.background.scripts) {
  if (!fs.existsSync(path.join(root, script))) {
    throw new Error(`Missing background script: ${script}`);
  }
}

if (manifest.applications) {
  throw new Error("Use browser_specific_settings instead of deprecated applications.");
}

if (!manifest.browser_specific_settings?.gecko?.id) {
  throw new Error("Firefox add-ons need a stable browser_specific_settings.gecko.id before release.");
}

const dataCollection = manifest.browser_specific_settings.gecko.data_collection_permissions;
if (!dataCollection?.required?.includes("none")) {
  throw new Error("Declare no data collection with browser_specific_settings.gecko.data_collection_permissions.required = [\"none\"].");
}

if (JSON.stringify(manifest).includes("storage.sync")) {
  throw new Error("This extension must not advertise or rely on storage.sync.");
}

console.log(`Manifest OK: ${manifest.name} ${manifest.version}`);
