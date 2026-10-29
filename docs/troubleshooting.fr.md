[Français](troubleshooting.fr.md) · [English](troubleshooting.md)

<a id="content"></a>

# Dépannage

| Ce que tu vois                                  | Ce que cela signifie                                     | Action                                                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| « Build successful », puis échec                | Le code a été construit mais le serveur n’a pas démarré  | Lire les dernières lignes des logs : le nom du paramètre incomplet est indiqué.                                                |
| « Configuration à compléter »                   | Valeur manquante ou mauvais format                       | Corriger seulement les paramètres nommés dans Environment → Edit.                                                              |
| Mot de passe incorrect                          | La valeur saisie diffère de `OWNER_PASSWORD`             | Réessayer sur le formulaire, ou modifier ce mot de passe dans Render puis redéployer.                                          |
| Demande expirée/déjà utilisée                   | Délai dépassé, demande consommée ou redémarrage          | Fermer la fenêtre et relancer une seule connexion fraîche dans ChatGPT.                                                        |
| Session du navigateur absente                   | Cookie absent ou formulaire d’une autre fenêtre          | Repartir d’une seule fenêtre et autoriser les cookies pour ton service Render.                                                 |
| Premier clic sans retour puis demande utilisée  | Retour OAuth potentiellement bloqué ou ancienne version  | Vérifier que la version utilisée inclut les corrections de politique de formulaire ; ne pas répéter le mot de passe en boucle. |
| Bouton Connecter grisé                          | Tentative en attente ou état de l’interface à rafraîchir | Actualiser une fois la page des plugins ; vérifier le statut Live et relancer le consentement.                                 |
| Réponse sur un auteur mais aucune donnée Zotero | Instructions chargées sans outil réel                    | Vérifier la connexion MCP et OAuth ; tester la connexion directement dans une nouvelle conversation.                           |
| `WRITES_DISABLED`                               | Le serveur est volontairement en lecture seule           | Après test de lecture, saisir `true` dans `WRITE_ENABLED`, puis Save and deploy.                                               |
| `AUTH_REQUIRED` ou droits Zotero insuffisants   | Clé révoquée, absente ou droits incomplets               | Vérifier la clé dédiée dans Zotero, puis sa valeur dans Render.                                                                |
| `VERSION_CONFLICT`                              | Une modification est survenue depuis la lecture          | Relire la notice et sa version avant une nouvelle tentative.                                                                   |
| `PROBABLE_DUPLICATE`                            | Référence proche déjà présente                           | Examiner les candidats, enrichir l’existant ; ne pas contourner par un titre inventé.                                          |
| `RATE_LIMIT`                                    | Zotero demande une pause                                 | Attendre le délai indiqué ; ne pas multiplier les appels.                                                                      |
| Premier appel très lent                         | Service Render gratuit en veille                         | Laisser le service se réveiller puis réessayer.                                                                                |

## Retour utile et sans secrets

Indique l’étape du guide, l’application ChatGPT utilisée, le message exact, le statut Render et le résultat d’une lecture connue. Masque toutes les valeurs de variables, les transcriptions et l’URL complète de consentement.

Pour un accompagnant technique : `npm run doctor -- --url https://YOUR-SERVICE.onrender.com` vérifie l’accessibilité et la découverte OAuth, sans demander de clé ni lire Zotero.
