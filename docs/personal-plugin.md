[English](personal-plugin.md) · [Français](personal-plugin.fr.md)

<a id="content"></a>

# The ChatGPT plugin: what exists and what still needs binding

**No additional server to develop.** Adding the MCP in ChatGPT already provides this project's eight tools. The optional package adds reusable bibliographic instructions.

Declaring an address in `mcp.json` does not necessarily replace registering the connection in ChatGPT's interface. In the developer's validated setup, you must first register the MCP, complete OAuth and then bind the created application to the workflow.

## For nontechnical users

Start with the MCP connection alone and the installation guide examples. Then ask Plugin Creator to associate [this workflow](../plugin-template/skills/zotero-library/SKILL.md) with **your existing connection**. Provide its public application ID from “Show details”, starting with `asdk_app_`. Do not provide a key or password. If you already created a personal plugin, request an update rather than recreating it.

## Generate the files automatically

One command, run at the root of the downloaded code:

```sh
npm run package:plugin -- --url https://YOUR-SERVICE.onrender.com --app-id asdk_app_YOUR_VERIFIED_ID --archive
```

The `dist/zotero-cloud` directory contains:

- `plugin.json`: workflow identity and description;
- `mcp.json`: your MCP address and public OAuth settings;
- `.app.json`: **your** registered ChatGPT application;
- `skills/zotero-library/SKILL.md`: the bibliographic method.

The script refuses to overwrite an existing directory. `--archive` requires the system `tar` command. Importing the package with Plugin Creator is a separate step; it is not publication in the public directory.

Do not redistribute your personalized package as a universal one: its address and application point to your installation. Redistribute the **template and generator**, which are not bound to anyone's account.
