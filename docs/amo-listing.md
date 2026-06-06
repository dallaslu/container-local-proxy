# AMO Listing Draft

## Name

Container Local Proxy

## Summary

Use local-only proxy settings for each Firefox container identity.

## Description

Container Local Proxy lets Firefox container users assign a different local proxy endpoint to each container identity without syncing network-specific proxy addresses.

It is designed to complement Firefox Multi-Account Containers. Let FMAC manage identities, site assignment, and synchronization. Use this add-on to keep per-identity proxy endpoints local to each machine or network.

This add-on does not read or modify FMAC's private configuration, does not create FMAC site rules, and does not forward local TCP ports. It replaces FMAC's per-identity proxy setting with a local-only proxy table.

## Privacy Policy

Container Local Proxy stores configuration only in Firefox local extension storage on the user's device. It does not collect, transmit, sell, or share personal data.

The add-on needs access to request URLs only so Firefox can ask it which proxy to use for each request. The add-on does not send browsing history or proxy settings to any external service.

## Version 0.1.0 Release Notes

Initial preview release.

- Configure local proxy endpoints per Firefox container identity.
- Support HTTP, HTTPS, SOCKS4, and SOCKS5 proxy endpoints.
- Support optional SOCKS DNS proxying and proxy authentication.
- Import and export local JSON backups.

## Suggested Category

Privacy & Security

## Suggested Tags

containers, proxy, firefox containers, local proxy, multi-account containers
