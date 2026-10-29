[Français](privacy.fr.md) · [English](privacy.md)

<a id="content"></a>

# Données et accès : installation personnelle

Ce document décrit le fonctionnement technique de la version auto-hébergée. Il ne constitue pas la politique d’un service multiutilisateur : aucun service commun n’est fourni par le projet.

## Qui reçoit quoi ?

- **Zotero** conserve la bibliothèque et traite les lectures/écritures demandées à son API.
- **Ton serveur Render** reçoit les appels MCP et les réponses Zotero. Sa clé d’accès et ses secrets restent dans ses variables d’environnement.
- **ChatGPT / OpenAI** reçoit les résultats des outils utilisés dans tes conversations, dont les métadonnées et notes demandées. Les paramètres de confidentialité du compte et les conditions du service s’appliquent.
- **Le dépôt GitHub** contient du code et de la documentation, pas de bibliothèque, de clé ni de mot de passe. Le développeur n’a pas besoin d’accéder à ton compte Render ou à ta clé pour t’aider à partir d’un diagnostic anonymisé.

Le code du serveur ne journalise ni les mots de passe ni les notices. Des journaux techniques peuvent néanmoins être produits par les hébergeurs ; ne pas activer de capture des corps HTTP ou d’URLs OAuth complètes dans un proxy. Les requêtes OAuth contiennent des valeurs propres au parcours de connexion.

## Étendue de l’autorisation

Une clé Zotero avec écriture possède des droits API plus larges que les huit outils de ce projet. Le serveur n’expose pas de suppression et refuse les méthodes DELETE, mais il faut conserver la clé secrète. `WRITE_ENABLED=false` désactive toutes les écritures de ce serveur ; il ne réduit pas les droits de la clé dans Zotero.

Les notes scientifiques peuvent contenir des informations confidentielles. Avant de les faire lire à ChatGPT, vérifie que leur transmission convient à ton contexte de recherche et aux engagements pris envers les personnes concernées.

## Retirer l’accès

1. Révoquer la clé dédiée dans Zotero arrête les futurs accès de ce serveur à la bibliothèque.
2. Déconnecter le MCP dans ChatGPT arrête son utilisation depuis ce compte ; le serveur reste hébergé tant qu’il n’est pas arrêté dans Render.
3. Changer `AUTH_SIGNING_SECRET` dans Render invalide les tokens MCP déjà émis. Changer `OWNER_PASSWORD` seul n’invalide pas les tokens déjà émis, qui expirent au bout de 8 heures.
4. Supprimer le service Render est une action de l’utilisateur dans son hébergeur ; elle ne supprime pas les notices Zotero.

Aucun secret ne doit être transmis à un mainteneur, dans un ticket, un prompt ou un paquet de plugin. Chaque personne garde son instance indépendante.
