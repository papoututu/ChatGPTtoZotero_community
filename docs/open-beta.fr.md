[Français](open-beta.fr.md) · [English](open-beta.md)

<a id="content"></a>

# Bêta ouverte : tester sans devenir collaborateur

## Ce que permet l’accès public

Tout le monde peut lire le dépôt public et télécharger son code. Une personne connectée à GitHub peut signaler un problème, copier le projet dans son compte et proposer des changements dans une pull request. Aucune de ces actions ne lui donne le droit de modifier le dépôt d’origine ou d’y fusionner sa propre proposition.

Aucun testeur n’a besoin d’un accès collaborateur. Le mainteneur garde la responsabilité d’accepter les changements. Le statut brouillon et la visibilité publique sont indépendants : un brouillon peut être lu par toute personne ayant accès au dépôt.

## Chaque testeur dispose d’une installation indépendante

- Déploie ton propre service Render avec le bouton de bêta. N’utilise pas le serveur du mainteneur.
- Crée ta clé Zotero dédiée et ton mot de passe du connecteur ; ne les envoie jamais à un mainteneur ou à un autre testeur.
- Commence avec `WRITE_ENABLED=false` et compare une collection ou une notice connue à Zotero Web.
- Pour la première écriture, utilise quelques références non confidentielles, active explicitement `WRITE_ENABLED=true` et ajoute seulement la note de validation convenue. Cette note restera dans Zotero puisqu’aucun outil de suppression n’est proposé.
- Ne transmets pas de matériaux de recherche confidentiels simplement pour participer au test. Vérifie la disponibilité mobile dans l’application et le compte que tu utilises réellement.

Publier le code ne donne accès au compte Render ou à la bibliothèque Zotero de personne. Les droits d’écriture GitHub et `WRITE_ENABLED` dans le serveur sont deux contrôles distincts.

## Retours d’une communauté ouverte

Indique l’étape du guide, l’application/le système, le résultat attendu et obtenu et le message d’erreur anonymisé dans le modèle de ticket. N’inclus jamais de clé, mot de passe, URL OAuth complète ou export de bibliothèque. Suggérer du code consiste à proposer une pull request, pas à modifier la version maintenue. Relis les propositions avant d’installer un fork ou de copier du code trouvé dans un commentaire.

## Paramètres du dépôt et des automatisations

| Protection | État ou action |
|---|---|
| Aucun droit d’écriture pour les visiteurs ordinaires | Comportement par défaut d’un dépôt public ; ne pas inviter les testeurs comme collaborateurs. |
| Jeton CI en lecture seule | Le workflow déclare `permissions: contents: read` ; le téléchargement du code ne conserve pas les identifiants. |
| Aucun déploiement automatique chez les testeurs | Le Blueprint communautaire définit `autoDeployTrigger: off`. |
| Aucune exécution privilégiée des forks | Pas de workflow `pull_request_target` ; tests avec identifiants fictifs. Ne pas ajouter de secrets du dépôt à des tests non fiables. |
| Audit de publication | La CI inspecte l’historique Git accessible pour des motifs courants de secrets, y compris les fichiers retirés. Les résultats indiquent les emplacements, pas les valeurs. |
| Protection des branches | Vérifier et configurer dans GitHub Settings avant publication : tests réussis, interdiction des modifications forcées et suppressions de branches. Ne pas exiger un approbateur externe indisponible lorsque le mainteneur est seul. |
| Exécutions des nouveaux contributeurs | Vérifier les paramètres d’approbation GitHub Actions avant les contributions ouvertes ; ne pas autoriser les jetons d’écriture pour les pull requests de forks. |

Les paramètres du dépôt des deux dernières lignes ne sont pas configurés par le simple ajout de ce document. Un audit automatisé sans alerte ne garantit pas que chaque secret ou donnée personnelle a été détecté. Relis les résultats, les anciens documents et les logs Actions avant publication.

## Critères de validation de la bêta

Utilise [le protocole de test](first-testers.fr.md) et [le guide d’installation](installation.fr.md). Rapporte séparément la lecture, le dédoublonnage, l’écriture unique et la disponibilité mobile. Une installation fonctionnelle pour son développeur ne prouve pas que les débutants peuvent la terminer. La bêta peut commencer sans connaître personnellement les testeurs.
