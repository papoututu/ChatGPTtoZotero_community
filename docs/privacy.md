[English](privacy.md) · [Français](privacy.fr.md)

<a id="content"></a>

# Data and access: personal installation

This document describes the self-hosted version's technical behavior. It is not a multiuser service's policy: the project does not provide a shared service.

## Who receives what?

- **Zotero** stores the library and processes API reads/writes.
- **Your Render server** receives MCP calls and Zotero responses. Its access key and secrets remain in its environment variables.
- **ChatGPT / OpenAI** receives tool results used in your conversations, including requested metadata and notes. Your account privacy settings and the service terms apply.
- **The GitHub repository** contains code and documentation, not a library, key or password. The developer does not need access to your Render account or key to help from an anonymized diagnostic.

The server code does not log passwords or library items. Hosting providers may nevertheless generate technical logs; do not enable HTTP body capture or full OAuth URL logging in a proxy. OAuth requests contain values specific to the connection flow.

## Scope of authorization

A Zotero key with write access has broader API permissions than this project's eight tools. The server exposes no deletion and rejects DELETE methods, but the key must remain secret. `WRITE_ENABLED=false` disables this server's writes; it does not reduce the key's Zotero permissions.

Research notes can contain confidential information. Before asking ChatGPT to read them, check that transmission suits your research context and commitments to the people involved.

## Remove access

1. Revoking the dedicated key in Zotero stops future library access by this server.
2. Disconnecting the MCP in ChatGPT stops use from that account; the server remains hosted until stopped in Render.
3. Changing `AUTH_SIGNING_SECRET` in Render invalidates issued MCP tokens. Changing `OWNER_PASSWORD` alone does not invalidate existing tokens, which expire after 8 hours.
4. Deleting the Render service is an action you take in your hosting account; it does not delete Zotero items.

Never send a secret to a maintainer, issue, prompt or plugin package. Everyone keeps their own independent instance.
