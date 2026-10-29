[Français](architecture.fr.md) · [English](architecture.md)

<a id="content"></a>

# Architecture du connecteur personnel

ChatGPT → connexion MCP personnelle → serveur HTTPS → Zotero Web API v3 → bibliothèque personnelle.

Node.js 24 et SDK MCP TypeScript officiel v2, HTTP natif, Zod et jose. Pas de dépendance Zotero Desktop, de pièce jointe ou de base de données. Une instance de serveur par utilisateur.

- La clé Zotero dédiée reste dans les secrets serveur. L’API v3 reçoit les en-têtes de version et de clé.
- ChatGPT s’authentifie auprès du serveur via OAuth code + PKCE S256, client public prédéfini. Les URI, audience, états, versions et cookies sont contrôlés.
- OAuth Zotero 1.0a n’est pas encore implémenté : la clé dédiée est fournie manuellement. Le fournisseur de credentials du client API isole cette partie pour une migration future.
- Les demandes et codes OAuth courts sont conservés en mémoire. Un redémarrage peut interrompre une connexion en cours ; les tokens signés expirent après 8 heures sans refresh automatique.
- Les huit tools ont des schémas et annotations lecture/écriture. Les autorisations sont réellement imposées par le serveur, pas par les seules instructions ChatGPT.
- Une lecture paginée et une précondition de version protègent les créations ; les candidats ambigus bloquent l’ajout. Les modifications de notices exigent une version récente. Les tags/collections s’ajoutent aux existants.
- Aucune méthode DELETE ni outil de suppression. Pas de remplacement de note par l’outil générique de mise à jour.

## Précautions apprises pendant le prototype

Les formulaires OAuth ont besoin de conserver leur origine lors d’un POST : une Referrer-Policy `no-referrer` peut transformer l’origine en null. La page utilise `strict-origin` pour préserver le contrôle sans exposer les paramètres de demande.

Certains navigateurs appliquent `form-action` également aux redirections après envoi du formulaire. La politique autorise donc l’origine du serveur et celle du callback ChatGPT configuré. Le mot de passe est envoyé seulement au serveur ; le callback reçoit un GET avec un code court. Un test navigateur a reproduit le blocage puis validé la correction avec des identifiants et un callback simulés.

## Limites de distribution

Les identifiants d’application ChatGPT appartiennent à l’installation de chacun. Le modèle ne contient aucun lien vers une bibliothèque, une application ou un serveur personnel du développeur. Le déploiement d’un code source public n’est pas une validation du parcours par tous les comptes ou toutes les applications mobiles.
