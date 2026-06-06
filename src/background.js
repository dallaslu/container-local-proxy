/* global browser, ContainerLocalProxyRouting */
"use strict";

const DEFAULT_LOCAL_CONFIG = {
  enabled: true,
  containerProxies: {}
};

let config = DEFAULT_LOCAL_CONFIG;

async function loadState() {
  const localData = await browser.storage.local.get(DEFAULT_LOCAL_CONFIG);
  config = {
    enabled: localData.enabled !== false,
    containerProxies: localData.containerProxies || {}
  };
}

function handleProxyRequest(details) {
  return ContainerLocalProxyRouting.decideProxy(config, details);
}

function endpointMatchesChallenger(endpoint, challenger) {
  return endpoint
    && endpoint.enabled !== false
    && endpoint.username
    && endpoint.password
    && endpoint.host === challenger.host
    && Number(endpoint.port) === Number(challenger.port);
}

function handleProxyAuth(details) {
  if (!details.isProxy || !details.challenger) {
    return {};
  }

  const endpoint = Object.values(config.containerProxies || {})
    .find((item) => endpointMatchesChallenger(item, details.challenger));

  if (!endpoint) {
    return {};
  }

  return {
    authCredentials: {
      username: endpoint.username,
      password: endpoint.password
    }
  };
}

async function handleMessage(message) {
  if (!message || !message.type) {
    return null;
  }

  if (message.type === "get-state") {
    await loadState();
    const identities = await browser.contextualIdentities.query({});
    return {
      config,
      identities
    };
  }

  if (message.type === "save-local") {
    await browser.storage.local.set(message.payload || DEFAULT_LOCAL_CONFIG);
    await loadState();
    return { ok: true };
  }

  if (message.type === "export-config") {
    await loadState();
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      config
    };
  }

  return null;
}

browser.proxy.onRequest.addListener(handleProxyRequest, { urls: ["<all_urls>"] });
browser.webRequest.onAuthRequired.addListener(
  handleProxyAuth,
  { urls: ["<all_urls>"] },
  ["blocking"]
);
browser.runtime.onMessage.addListener(handleMessage);
browser.storage.onChanged.addListener(loadState);
browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});

loadState();
