[English](publication.md) · [Français](publication.fr.md)

<a id="content"></a>

# Publish an open beta

## Distribution model

The proposed model is a public repository whose ordinary visitors cannot write to it. Testers need no collaborator invitation. Each person runs their own server and supplies their own Zotero authorization. Follow [the open-beta protocol](open-beta.md).

Publish this community snapshot in a new repository named `ChatGPTtoZotero_community`, starting with a fresh initial commit on `main`. Do not fork or import the private development repository: that would copy its Git history. Keep the original repository private. The deployment button targets the new repository and disables automatic code deployments for new instances. Confirm the repository name and link before announcing the beta.

## Before publication

- Run `npm run audit:public -- --history` on a full Git checkout and review findings. Revoke any exposed credential, including one removed from a later commit.
- Review historical documentation, Actions logs and artifacts: these may also become public. The automated audit is heuristic, not a privacy certification.
- Check collaborator access in Settings. Do not grant write permission to open-beta testers.
- Verify Actions fork-approval settings, read-only token permissions and branch protection. Requiring tests is useful; requiring an external approval when no other maintainer exists would block your own work.
- Keep the personal Render secrets outside GitHub. Test with independent instances, not shared access to the owner's library.
- Publish only the prepared community snapshot after these checks; do not change the original repository visibility. No paid service is needed for this proposed distribution.

## What can be shared after publication

Share the beta README, installation guide and issue template on Reddit or Zotero forums. A draft status is allowed during beta testing; it describes readiness for merging, not access rights. Request anonymized reports using [the tester protocol](first-testers.md). A shared multiuser hosting service and publication in ChatGPT's official directory remain separate projects.

## Official sources

- [Personal repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).
- [Visibility changes and public history/logs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility).
- [Render deployment buttons](https://render.com/docs/deploy-to-render) and [Blueprint settings](https://render.com/docs/blueprint-spec).
- [ChatGPT MCP setup](https://developers.openai.com/api/docs/guides/custom-mcp-server).
