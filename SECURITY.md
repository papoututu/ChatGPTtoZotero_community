[English](SECURITY.md) · [Français](SECURITY.fr.md)

<a id="content"></a>

# Reporting a security issue

Never publish a key, password, library content or consent URL in an issue.

If private GitHub vulnerability reporting is available for the repository, use it. Otherwise, open an issue stating only that you need a private reporting channel, without publicly describing an exploit or its secrets. The maintainer must confirm a private channel before details are sent.

If a key is exposed, revoke it in Zotero first. The connector password and signing secret can be changed in Render; changing the signing secret invalidates MCP tokens. This server is not designed as a multiuser service.
