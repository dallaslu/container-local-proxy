(function (global) {
  "use strict";

  const PROXY_TYPES = new Set(["http", "https", "socks", "socks4"]);

  function normalizeHost(value) {
    return String(value || "").trim().toLowerCase().replace(/\.$/, "");
  }

  function endpointToProxyInfo(endpoint) {
    if (!endpoint || endpoint.enabled === false) {
      return { type: "direct" };
    }

    const type = String(endpoint.type || "socks").toLowerCase();
    const host = normalizeHost(endpoint.host);
    const port = Number(endpoint.port);

    if (!PROXY_TYPES.has(type) || !host || !Number.isInteger(port) || port < 1 || port > 65535) {
      return { type: "direct" };
    }

    const proxyInfo = {
      type,
      host,
      port
    };

    if (type === "socks" || type === "socks4") {
      proxyInfo.proxyDNS = endpoint.proxyDNS !== false;
    }

    if (endpoint.username) {
      proxyInfo.username = String(endpoint.username);
    }

    if (endpoint.password) {
      proxyInfo.password = String(endpoint.password);
    }

    return proxyInfo;
  }

  function endpointForRequest(config, requestDetails) {
    const containerId = requestDetails.cookieStoreId || "firefox-default";
    return (config.containerProxies || {})[containerId] || null;
  }

  function decideProxy(config, requestDetails) {
    if (!config || config.enabled === false) {
      return { type: "direct" };
    }

    return endpointToProxyInfo(endpointForRequest(config, requestDetails));
  }

  const api = {
    decideProxy,
    endpointForRequest,
    endpointToProxyInfo,
    normalizeHost
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.ContainerLocalProxyRouting = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
