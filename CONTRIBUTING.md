[English](CONTRIBUTING.md) · [Français](CONTRIBUTING.fr.md)

<a id="content"></a>

# Contributing and keeping both languages aligned

English is the primary reading language. French is maintained with the same sections, commands, settings and technical limits. Generated pages have a language switch at the top.

## Change documentation once, in its paired source

Do not edit generated Markdown pages directly. Each file in `docs/source/` contains shared section IDs, English text (`en`) and French text (`fr`). `facts.json` holds shared numeric limits; illustration labels are paired in `illustrations.json`. The renderer generates both versions together.

1. Update both texts in the relevant section when the meaning changes. Use shared placeholders for document links, images and facts.
2. Review that the two texts express the same instructions. A checksum records the reviewed pair; it does not judge translation quality.
3. Run:

```sh
npm run docs:build -- --review
npm run check
npm test
```

`--review` records your explicit review of the language pairs before generating the pages. Without it, unreviewed changes fail. `npm run docs:check` checks that the pages match their source and that paired sections retain the same commands, technical identifiers, heading levels and shared variables. CI runs this check.

Semantic translation quality still requires human review. Do not claim that automatic checks prove the two texts mean the same thing. Shared facts ensure that a limit edited in one place is rendered identically in both languages.

## Code and test reports

Use mock credentials and a personal test instance. Never attach real keys, passwords, confidential library data or OAuth URLs. Changes proposed in a pull request are separate from the main branch and can be reviewed before merging.

A draft pull request means the work remains under preparation; it is not a deployment, public release or approval to change an existing installation. Only merging changes the target branch; hosting and publication settings are separate.
