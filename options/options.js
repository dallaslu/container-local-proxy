/* global browser */
"use strict";

const DEFAULT_ENDPOINT = {
  enabled: false,
  type: "socks",
  host: "",
  port: "",
  username: "",
  password: "",
  proxyDNS: true
};

const state = {
  config: { enabled: true, containerProxies: {} },
  identities: []
};

const $ = (selector, root = document) => root.querySelector(selector);
const identityList = $("#identityList");
const status = $("#status");

function setStatus(text) {
  status.textContent = text;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    status.textContent = "";
  }, 2500);
}

function endpointFor(containerId) {
  return {
    ...DEFAULT_ENDPOINT,
    ...(state.config.containerProxies[containerId] || {})
  };
}

function renderIdentity(identity) {
  const endpoint = endpointFor(identity.cookieStoreId);
  const row = $("#identityTemplate").content.firstElementChild.cloneNode(true);
  row.dataset.containerId = identity.cookieStoreId;
  $('[data-field="name"]', row).textContent = identity.name;
  $('[data-field="cookieStoreId"]', row).textContent = identity.cookieStoreId;
  $('[data-field="type"]', row).value = endpoint.type || "socks";
  $('[data-field="host"]', row).value = endpoint.host || "";
  $('[data-field="port"]', row).value = endpoint.port || "";
  $('[data-field="username"]', row).value = endpoint.username || "";
  $('[data-field="password"]', row).value = endpoint.password || "";
  $('[data-field="proxyDNS"]', row).checked = endpoint.proxyDNS !== false;
  $('[data-field="endpointEnabled"]', row).checked = endpoint.enabled === true;
  return row;
}

function render() {
  $("#enabled").checked = state.config.enabled !== false;
  identityList.textContent = "";

  state.identities.forEach((identity) => {
    identityList.append(renderIdentity(identity));
  });

  if (state.identities.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "没有找到 Firefox 容器。请先在 Firefox Multi-Account Containers 中创建身份。";
    identityList.append(empty);
  }
}

function readForm() {
  const containerProxies = {};

  identityList.querySelectorAll(".identityRow").forEach((row) => {
    const containerId = row.dataset.containerId;
    containerProxies[containerId] = {
      enabled: $('[data-field="endpointEnabled"]', row).checked,
      type: $('[data-field="type"]', row).value,
      host: $('[data-field="host"]', row).value.trim(),
      port: Number($('[data-field="port"]', row).value),
      username: $('[data-field="username"]', row).value.trim(),
      password: $('[data-field="password"]', row).value,
      proxyDNS: $('[data-field="proxyDNS"]', row).checked
    };
  });

  state.config = {
    enabled: $("#enabled").checked,
    containerProxies
  };
}

async function save() {
  readForm();
  await browser.runtime.sendMessage({ type: "save-local", payload: state.config });
  setStatus("已保存到本机");
}

async function load() {
  const data = await browser.runtime.sendMessage({ type: "get-state" });
  state.config = data.config || { enabled: true, containerProxies: {} };
  state.identities = data.identities || [];
  render();
}

async function exportConfig() {
  readForm();
  await save();
  const data = await browser.runtime.sendMessage({ type: "export-config" });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "container-local-proxy.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function importConfig(file) {
  const imported = JSON.parse(await file.text());
  const config = imported.config || imported.local;

  if (!config || !config.containerProxies) {
    throw new Error("Invalid config file");
  }

  state.config = config;
  render();
  await save();
}

$("#refresh").addEventListener("click", load);
$("#save").addEventListener("click", save);
$("#export").addEventListener("click", exportConfig);
$("#import").addEventListener("change", async (event) => {
  try {
    await importConfig(event.target.files[0]);
    setStatus("已导入");
  } catch (error) {
    setStatus(error.message);
  } finally {
    event.target.value = "";
  }
});

load();
