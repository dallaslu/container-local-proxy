# Container Local Proxy

Container Local Proxy is a Firefox-only WebExtension that replaces Firefox Multi-Account Containers' per-identity proxy setting with a local-only proxy table.

The add-on does one thing:

- When a request is made from a Firefox container identity, use the proxy endpoint configured locally for that identity.

It does not store proxy endpoints in `browser.storage.sync`, and it does not add domain rules to FMAC. This keeps FMAC sync useful for container identity and site assignment, while keeping network-specific proxy addresses off Firefox Sync.

## Intended FMAC Setup

Use Firefox Multi-Account Containers for:

- Creating and syncing identities.
- Opening specific domains in specific identities.
- Cookie and site-data isolation.

Use Container Local Proxy for:

- Assigning a local proxy endpoint to each identity.
- Keeping those proxy endpoints different on each computer or network.

Do not configure FMAC's own per-identity proxy feature for identities handled by this add-on. If both extensions try to decide the proxy for the same request, Firefox extension ordering can make the result hard to reason about.

## Important Limitations

Firefox extensions cannot read FMAC's private synced proxy configuration. They also cannot listen on local TCP ports, so this add-on cannot remap `127.0.0.1:1080` to another endpoint after FMAC has selected that proxy.

This project is therefore not a port forwarder. It is a local-only replacement for FMAC's per-identity proxy feature.

## Features

- Route all traffic from a Firefox container identity through a local proxy endpoint.
- Store all proxy settings in `browser.storage.local`.
- Support HTTP, HTTPS, SOCKS4, and SOCKS5 proxy endpoints.
- Optional proxy DNS for SOCKS endpoints.
- Optional proxy username and password.
- Import and export local JSON backups.

## Development

Requirements:

- Firefox 142 or later.
- Node.js 18 or later for local tests and packaging.

Run checks:

```sh
npm test
npm run lint:manifest
npm run build
```

If `npm` is not available, the same checks can be run directly:

```sh
node --test
node scripts/validate-manifest.js
node scripts/build.js
```

Load temporarily in Firefox:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click "Load Temporary Add-on".
3. Select `manifest.json` from this directory.

The build command writes an unsigned ZIP to `dist/`. Firefox release users require an add-on signed by Mozilla.

## Publishing

Before publishing:

1. Replace `browser_specific_settings.gecko.id` in `manifest.json` with your final add-on ID.
2. Update `homepage_url` to the final repository or support page.
3. Run `npm run check`.
4. Submit the generated ZIP to addons.mozilla.org, or sign with `web-ext sign`.

Suggested AMO listing metadata is in [docs/amo-listing.md](/Users/dallaslu/Documents/fm/docs/amo-listing.md).

Official references:

- [MDN proxy API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/proxy)
- [web-ext command reference](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)

## Permissions

- `proxy`: decide the proxy per request.
- `contextualIdentities`: list Firefox containers for editing.
- `storage`: store local per-identity proxy endpoints.
- `webRequest` and `webRequestBlocking`: provide proxy authentication credentials when configured.
- `<all_urls>`: allow proxy decisions for all requested hosts.
