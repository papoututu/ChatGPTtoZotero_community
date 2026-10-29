[English](open-beta.md) · [Français](open-beta.fr.md)

<a id="content"></a>

# Open beta: test safely without becoming a collaborator

## What public access allows

Anyone can read the public repository and download its code. A person signed in to GitHub can report an issue, fork the project and propose changes in a pull request. None of these actions gives them permission to push changes to the original repository or merge their own proposal there.

No tester needs collaborator access. The maintainer remains responsible for accepting changes. Draft pull requests and public visibility are independent: a draft can be viewed by anyone who can access its repository.

## Each tester has an independent installation

- Deploy your own Render service using the beta button. Do not use the maintainer's server.
- Create your own dedicated Zotero key and connector password; never send them to a maintainer or another tester.
- Start with `WRITE_ENABLED=false` and verify a known collection or item against Zotero Web.
- For the first write, use a few nonconfidential references, enable `WRITE_ENABLED=true` explicitly, and add only the agreed validation note. The note remains in Zotero because no deletion tool is provided.
- Do not upload confidential research materials merely to participate in testing. Check mobile availability in the exact app/account you use.

Publishing source code does not grant access to anyone's Render account or Zotero library. Write permissions in GitHub and `WRITE_ENABLED` in the server are different controls.

## Feedback from an open community

Report the guide step, application/OS, expected and actual result, and anonymized error message using the feedback issue template. Never include a key, password, full OAuth URL or library export. Posting code suggestions means proposing a pull request, not changing the maintained version. Review suggestions before installing a fork or copying code from a comment.

## Repository and automation settings

| Protection | State or action |
|---|---|
| No write access for ordinary visitors | Default behavior of a public repository; do not invite testers as collaborators. |
| Read-only CI token | The workflow declares `permissions: contents: read`; checkout does not persist credentials. |
| No automatic deployment to testers | The community Blueprint sets `autoDeployTrigger: off`. |
| No privileged fork execution | No `pull_request_target` workflow; tests use mock credentials. Do not add repository secrets to untrusted tests. |
| Publication audit | CI scans reachable Git history for common credential patterns, including removed files. Findings contain locations, not secret values. |
| Branch protection | Check and configure in GitHub Settings before publication: passing tests, no force pushes or deletions. Do not require an unavailable external approver when there is only one maintainer. |
| First-time contributor runs | Review the GitHub Actions approval settings before inviting open contributions; do not enable write tokens for fork pull requests. |

Repository settings in the last two rows are not configured by committing this document. A clean automated audit is not a guarantee that every secret or personal detail has been detected. Review the findings, old documentation and Actions logs before publishing.

## Beta acceptance criteria

Use [the tester protocol](first-testers.md) and [the installation guide](installation.md). Report reading, duplicate handling, the single controlled write and mobile availability separately. An installation that works for its developer is not evidence that beginners can complete it. The beta can begin before any external tester is known personally.
