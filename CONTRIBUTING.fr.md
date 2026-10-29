[Français](CONTRIBUTING.fr.md) · [English](CONTRIBUTING.md)

<a id="content"></a>

# Contribuer et garder les deux langues cohérentes

L’anglais est la langue principale de lecture. Le français conserve les mêmes sections, commandes, paramètres et limites techniques. Les pages générées proposent un lien de changement de langue en tête.

## Modifier la documentation dans sa source bilingue

Ne modifie pas directement les pages Markdown générées. Chaque fichier de `docs/source/` contient des identifiants de section communs, le texte anglais (`en`) et le texte français (`fr`). `facts.json` contient les limites numériques partagées ; les légendes des illustrations sont regroupées dans `illustrations.json`. Le générateur produit les deux versions ensemble.

1. Mets à jour les deux textes de la section quand le sens change. Utilise les variables partagées pour les liens de documents, les images et les faits.
2. Relis les deux textes pour vérifier qu’ils donnent les mêmes consignes. Une empreinte enregistre la paire relue ; elle ne juge pas la qualité de la traduction.
3. Exécute :

```sh
npm run docs:build -- --review
npm run check
npm test
```

`--review` enregistre ta relecture explicite des paires avant génération. Sans cette option, une modification non relue échoue. `npm run docs:check` vérifie que les pages correspondent à leurs sources et que les sections jumelles gardent les mêmes commandes, identifiants techniques, niveaux de titre et variables partagées. La CI exécute ce contrôle.

La qualité sémantique de la traduction nécessite toujours une relecture humaine. Ne présente pas les contrôles automatiques comme une preuve d’équivalence de sens. Les faits partagés garantissent qu’une limite modifiée à un seul endroit est reportée identiquement dans les deux langues.

## Code et retours de test

Utilise des identifiants fictifs et une instance de test personnelle. Ne joins jamais de clé réelle, mot de passe, contenu confidentiel ou URL OAuth. Les changements proposés dans une pull request restent séparés de la branche principale et peuvent être relus avant fusion.

Une pull request en brouillon est encore en préparation : ce n’est ni un déploiement, ni une publication, ni un accord pour modifier une installation existante. Seule sa fusion change la branche cible ; les paramètres d’hébergement et de publication sont distincts.
