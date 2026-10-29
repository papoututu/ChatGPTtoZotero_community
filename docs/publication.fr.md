[Français](publication.fr.md) · [English](publication.md)

<a id="content"></a>

# Publier une bêta ouverte

## Modèle de diffusion

Le modèle proposé est un dépôt public que les visiteurs ordinaires ne peuvent pas modifier. Les testeurs n’ont pas besoin d’une invitation comme collaborateurs. Chacun fait fonctionner son serveur et fournit son autorisation Zotero. Suivre [le protocole de bêta ouverte](open-beta.fr.md).

Publier cette copie communautaire dans un nouveau dépôt nommé `ChatGPTtoZotero_community`, avec un premier commit neuf sur `main`. Ne pas utiliser Fork ou l’import du dépôt de développement privé : cela copierait son historique Git. Garder le dépôt d’origine privé. Le bouton de déploiement cible le nouveau dépôt et désactive les déploiements automatiques du code pour les nouvelles instances. Vérifier le nom du dépôt et le lien avant d’annoncer la bêta.

## Avant publication

- Exécuter `npm run audit:public -- --history` dans une copie Git complète et relire les résultats. Révoquer tout identifiant secret exposé, même retiré dans un commit ultérieur.
- Relire les anciens documents, les logs et les artefacts Actions : ils peuvent aussi devenir publics. L’audit automatisé est heuristique, pas une certification de confidentialité.
- Vérifier les collaborateurs dans Settings. Ne pas donner de droit d’écriture aux testeurs de la bêta ouverte.
- Vérifier l’approbation des workflows de forks dans Actions, les permissions du jeton en lecture seule et la protection des branches. Exiger des tests est utile ; exiger une approbation externe sans autre mainteneur bloquerait ton propre travail.
- Garder les secrets Render personnels hors de GitHub. Tester sur des instances indépendantes, sans partager l’accès à la bibliothèque du propriétaire.
- Publier seulement la copie communautaire préparée après ces vérifications ; ne pas modifier la visibilité du dépôt d’origine. Aucun service payant n’est nécessaire pour ce modèle de diffusion.

## Ce qui peut être partagé après publication

Partager le README de bêta, le guide d’installation et le modèle de ticket sur Reddit ou les forums Zotero. Le statut brouillon est compatible avec ces tests : il décrit la préparation à une fusion, pas les droits d’accès. Demander des retours anonymisés avec [le protocole de test](first-testers.fr.md). Un hébergement commun multiutilisateur et une publication dans le répertoire officiel ChatGPT restent des projets distincts.

## Sources officielles

- [Droits d’un dépôt personnel](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).
- [Changement de visibilité et exposition de l’historique/logs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility).
- [Boutons de déploiement Render](https://render.com/docs/deploy-to-render) et [paramètres Blueprint](https://render.com/docs/blueprint-spec).
- [Connexion MCP ChatGPT](https://developers.openai.com/api/docs/guides/custom-mcp-server).
