[English](troubleshooting.md) · [Français](troubleshooting.fr.md)

<a id="content"></a>

# Troubleshooting

| What you see | What it means | What to do |
|---|---|---|
| “Build successful”, then failure | The code was built, but the server did not start | Read the final log lines: they name the incomplete setting. |
| “Configuration à compléter” | Missing value or incorrect format | Correct only the named settings under Environment → Edit. |
| Password incorrect | The entered value differs from `OWNER_PASSWORD` | Retry in the form, or change this password in Render and redeploy. |
| Request expired/already used | Timeout, consumed request or restart | Close the window and start one fresh connection in ChatGPT. |
| Browser session missing | Missing cookie or form from another window | Restart in a single window and allow cookies for your Render service. |
| First click has no return, then request used | Potentially blocked OAuth return or old version | Check that the version includes the tested form-policy fixes; do not keep entering the password in a loop. |
| Connect button disabled | Pending attempt or stale interface state | Refresh the plugins page once; check Live status and restart consent. |
| Author information, but no real data | Instructions loaded without a real tool | Check MCP and OAuth; test the connection directly in a new conversation. |
| `WRITES_DISABLED` | Server intentionally read-only | After testing reading, set `WRITE_ENABLED` to `true`, then Save and deploy. |
| `AUTH_REQUIRED` or insufficient Zotero permissions | Key revoked, missing or lacking permissions | Check the dedicated key in Zotero, then its value in Render. |
| `VERSION_CONFLICT` | Change since the last read | Read the item and its version again before retrying. |
| `PROBABLE_DUPLICATE` | A similar reference already exists | Examine candidates and enrich an existing item; do not bypass the check with an invented title. |
| `RATE_LIMIT` | Zotero requests a pause | Wait for the stated delay; do not multiply requests. |
| Very slow first request | Render's free service is sleeping | Allow it to wake up, then retry. |

## A useful report without secrets

State the guide step, ChatGPT application, exact message, Render status and result of a known read. Hide all variable values, transcripts and the full consent URL.

For technical assistance: `npm run doctor -- --url https://YOUR-SERVICE.onrender.com` checks accessibility and OAuth discovery without requesting a key or reading Zotero.
