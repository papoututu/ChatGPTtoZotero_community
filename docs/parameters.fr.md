[Français](parameters.fr.md) · [English](parameters.md)

<a id="content"></a>

# Les paramètres, en langage courant

Les exemples sont fictifs. N’utilise jamais une valeur copiée d’un exemple comme clé ou secret.

| Paramètre             | À remplir ?                     | Explication et emplacement                                                                                                                                                                                                   |
| --------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ZOTERO_USER_ID`      | Oui                             | Nombre affiché près de « User ID » sur Zotero → Settings → Keys. Exemple fictif : `1234567`.                                                                                                                                 |
| `ZOTERO_API_KEY`      | Oui, secret                     | Clé créée pour ce serveur, enregistrée exclusivement dans Render. La modifier révoque l’accès si l’ancienne est révoquée côté Zotero.                                                                                        |
| `OWNER_PASSWORD`      | Oui, secret                     | Mot de passe de 20 caractères minimum servant seulement sur la page de consentement du serveur. Ce n’est pas le mot de passe Zotero.                                                                                         |
| `WRITE_ENABLED`       | Oui dans le Blueprint           | Texte exact `false` pour lire seulement ; `true` pour autoriser les cinq outils d’écriture. Render peut masquer cette valeur comme un secret. Un espace périphérique est toléré, pas les guillemets ni les mots « oui/non ». |
| `AUTH_SIGNING_SECRET` | Non                             | Render le génère. Sert à signer les autorisations MCP. Au moins 32 caractères ; le changer invalide les connexions existantes.                                                                                               |
| `PUBLIC_URL`          | Non sur Render                  | Détectée depuis `RENDER_EXTERNAL_URL`. Pour un autre hébergeur : origine HTTPS, sans `/mcp`.                                                                                                                                 |
| `PORT`                | Non sur Render                  | Fourni par l’hébergeur ; `8787` par défaut en local.                                                                                                                                                                         |
| `OAUTH_CLIENT_ID`     | Non                             | `zotero-cloud-personal` par défaut. Ce nom n’est pas un secret et peut être identique sur des serveurs indépendants.                                                                                                         |
| `OAUTH_REDIRECT_URI`  | Seulement si ChatGPT le demande | Callback exact affiché dans la connexion. Valeur par défaut : `https://chatgpt.com/connector_platform_oauth_redirect`.                                                                                                       |
| `NODE_VERSION`        | Non                             | Version Node.js fixée dans le déploiement.                                                                                                                                                                                   |

Le serveur utilise une bibliothèque personnelle unique par installation. Ne renseigne pas la clé d’une autre personne pour « lui partager » ton serveur. Chaque testeur crée son instance.

## Ce qui est automatisé

HTTPS, commandes de construction/démarrage, secret de signature, découverte de l’adresse Render et métadonnées OAuth. Une erreur de configuration donne le **nom du paramètre** et son format attendu sans afficher sa valeur.

## Ce qui ne peut pas être prérempli par le développeur

Ton identifiant, ta clé Zotero, ton mot de passe et ta décision d’activer les écritures. Ces informations et décisions appartiennent à ton compte.
