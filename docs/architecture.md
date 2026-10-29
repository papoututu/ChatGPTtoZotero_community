[English](architecture.md) · [Français](architecture.fr.md)

<a id="content"></a>

# Personal connector architecture

ChatGPT → personal MCP connection → HTTPS server → Zotero Web API v3 → personal library.

Node.js 24 and official MCP TypeScript SDK v2, native HTTP, Zod and jose. No dependency on Zotero Desktop, attachments or a database. One server instance per user.

- The dedicated Zotero key stays in server secrets. API v3 receives version and key headers.
- ChatGPT authenticates to the server using OAuth code + PKCE S256 and a predefined public client. URIs, audience, state, versions and cookies are checked.
- Zotero OAuth 1.0a is not implemented yet: the dedicated key is supplied manually. The API client's credential provider isolates this part for future migration.
- Short-lived OAuth requests and codes are stored in memory. Restarting can interrupt a connection in progress; signed tokens expire after 8 hours, without automatic refresh.
- The eight tools have schemas and read/write annotations. The server actually enforces authorization, not just ChatGPT instructions.
- Paginated reading and a version precondition protect creation; ambiguous candidates block additions. Item updates require a recent version. Tags/collections append to existing values.
- No DELETE method or deletion tool. No note replacement through the generic update tool.

## Lessons from the prototype

OAuth forms need to preserve their origin on POST: Referrer-Policy `no-referrer` can make the origin null. The page uses `strict-origin` to preserve the check without exposing request parameters.

Some browsers also apply `form-action` to redirects following form submission. The policy therefore permits the server origin and the configured ChatGPT callback origin. The password is sent only to the server; the callback receives a GET with a short-lived code. A browser test reproduced the block and validated the fix using simulated credentials and callback.

## Distribution limits

ChatGPT application IDs belong to each person's installation. The template contains no binding to the developer's personal library, application or server. Publishing source code does not validate the setup for every account or mobile application.
