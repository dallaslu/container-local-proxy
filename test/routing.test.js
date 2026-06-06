"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const routing = require("../src/routing");

test("routes requests by container identity", () => {
  const config = {
    enabled: true,
    containerProxies: {
      "firefox-container-1": {
        enabled: true,
        type: "socks",
        host: "192.168.1.2",
        port: 1080
      }
    }
  };

  assert.deepEqual(routing.decideProxy(config, {
    cookieStoreId: "firefox-container-1",
    url: "https://example.com/"
  }), {
    type: "socks",
    host: "192.168.1.2",
    port: 1080,
    proxyDNS: true
  });
});

test("falls back to direct for unmapped containers", () => {
  const config = {
    enabled: true,
    containerProxies: {
      "firefox-container-1": {
        enabled: true,
        type: "http",
        host: "127.0.0.1",
        port: 8080
      }
    }
  };

  assert.deepEqual(routing.decideProxy(config, {
    cookieStoreId: "firefox-container-2",
    url: "https://example.com/"
  }), { type: "direct" });
});

test("falls back to direct when disabled", () => {
  assert.deepEqual(routing.decideProxy({
    enabled: false,
    containerProxies: {
      "firefox-container-1": {
        enabled: true,
        type: "http",
        host: "127.0.0.1",
        port: 8080
      }
    }
  }, {
    cookieStoreId: "firefox-container-1"
  }), { type: "direct" });
});

test("falls back to direct for disabled or invalid endpoints", () => {
  assert.deepEqual(routing.endpointToProxyInfo({ enabled: false }), { type: "direct" });
  assert.deepEqual(routing.endpointToProxyInfo({ type: "socks", host: "", port: 1080 }), { type: "direct" });
  assert.deepEqual(routing.endpointToProxyInfo({ type: "http", host: "127.0.0.1", port: 70000 }), { type: "direct" });
});
