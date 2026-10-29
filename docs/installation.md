[English](installation.md) · [Français](installation.fr.md)

<a id="content"></a>

# Install your own Zotero Cloud ↔ ChatGPT connection

This test setup requires no programming. Everyone keeps their own server and authorizations. Have your password manager ready and keep this guide open. The project does not provide personal credentials.

## 1. Create the Zotero authorization

Open [Zotero keys](https://www.zotero.org/settings/keys). Note the number beside **User ID**. This is not your username.

Click **Create new private key**, naming it “ChatGPT Zotero Cloud”. Allow your personal library, notes and writing; no groups are needed. Server-side writing remains disabled until the controlled test. Save the key in your password manager and paste it only into Render in the next step. Do not enter it in ChatGPT.

## 2. Deploy the server

From the published repository's README, click **Deploy to Render**. Sign in to Render and allow GitHub access if prompted. The service must be a **Web Service** on the **Free** plan. Our Blueprint defines no paid service.

Keep the proposed branch for a published stable release. Complete four fields:

![Diagram of Render settings, using fictitious values and masked secrets](images/render-settings.svg)

| Key | Value to enter |
|---|---|
| `ZOTERO_USER_ID` | Your numeric user ID, without quotation marks |
| `ZOTERO_API_KEY` | The dedicated key copied from Zotero |
| `OWNER_PASSWORD` | A new password of at least 20 characters, different from your Zotero password |
| `WRITE_ENABLED` | The text `false`, without quotation marks |

Click **Deploy Blueprint**. Wait for **Live**: **Build successful** alone only means the program has been built. If startup fails, the logs now identify the incomplete setting. Do not take screenshots showing secret values.

The service page gives its `https://…onrender.com` address. Open that address followed by `/health`: you should see `{"status":"ok"}`. Waking a sleeping service may take time. This does not yet check the Zotero key.

## 3. Register the connection in ChatGPT

Open [Plugins](https://chatgpt.com/plugins). Under **Add**, look for a custom MCP; labels may differ between applications. Choose **Streamable HTTP**, not **STDIO**.

![Diagram of a remote MCP connection](images/mcp-connection.svg)

- Name: `Zotero Cloud — connection`.
- Address: **your** Render address followed by `/mcp`.
- Authentication: OAuth, if requested.
- Client ID, if requested: `zotero-cloud-personal`.
- Client secret: empty; this is a public client.

Save, then start connecting. The “Autoriser votre connecteur personnel” page must belong to **your Render service**. Enter the password chosen for `OWNER_PASSWORD`, then click “Autoriser ChatGPT”. You should return to ChatGPT after one click. Do not repeatedly click if the page seems stuck: use [troubleshooting](troubleshooting.md).

If ChatGPT specifies a callback different from the default, enter its exact URL in `OAUTH_REDIRECT_URI` on Render. Do not publish the full OAuth form URL: it contains parameters specific to that request.

If the interface offers no MCP option or remains blocked, do not change your subscription for this guide: include the product you used in your test report. Availability must be checked for your account.

## 4. Verify a real read

In a **new conversation**, select your connection with `@`. Ask:

> List three of my existing collections with their identifiers, without changing anything.

Then search for a reference you know by DOI or title and compare it with Zotero Web. A general answer about an author without a tool call or library results does not validate the connection.

## 5. Allow and test one write

In Render, open **your service → Environment → Edit**. The `WRITE_ENABLED` row is a **masked text field**, not a dropdown. Replace `false` with `true`, without quotation marks, then choose **Save and deploy**. Wait for **Live**. Leave the other variables unchanged.

In ChatGPT:

> Find the item with DOI [the DOI of a unique reference you own]. If it is unique, propose a short validation note. After I agree, add this one child note, then read the notes again to confirm it was added once. Do not change anything else.

Avoid creating a fake item: the connector cannot delete the reference or its test note afterwards. Set `WRITE_ENABLED=false` again after testing if you wish.

## 6. Use the bibliographic workflow

The MCP connection already provides eight tools. You can ask it to add verified references, search before creating, append tags without removing existing ones and add notes based on your sources.

The [full workflow](../plugin-template/skills/zotero-library/SKILL.md) can then be attached to a personal plugin. This optional step is described in [Personal ChatGPT package](personal-plugin.md); it does not require a second server.

**Setup is complete when** OAuth returns correctly, a read is confirmed in Zotero Web, one controlled note is found and other data is unchanged. Then test your usual mobile app before claiming mobile use is validated.
