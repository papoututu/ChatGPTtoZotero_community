[Français](installation.fr.md) · [English](installation.md)

<a id="content"></a>

# Installer sa propre connexion Zotero Cloud ↔ ChatGPT

Ce parcours de test ne demande pas de programmation. Chaque utilisateur garde son serveur et ses autorisations. Prévoir son gestionnaire de mots de passe et garder ce guide ouvert. Aucun identifiant personnel n’est fourni par le projet.

## 1. Créer l’autorisation Zotero

Ouvre [les clés Zotero](https://www.zotero.org/settings/keys). Note le nombre affiché près de **User ID**. Ce n’est pas ton nom d’utilisateur.

Clique **Create new private key**, nomme-la « ChatGPT Zotero Cloud ». Autorise la bibliothèque personnelle, les notes et l’écriture ; aucun groupe n’est nécessaire. L’écriture sera encore désactivée dans le serveur jusqu’au test contrôlé. Enregistre la clé dans ton gestionnaire de mots de passe et copie-la uniquement dans Render à l’étape suivante. Ne la saisis pas dans ChatGPT.

## 2. Déployer le serveur

Depuis le README du dépôt publié, clique **Déployer sur Render**. Connecte-toi à ton compte Render et autorise l’accès GitHub si demandé. Le service doit être **Web Service**, avec le plan **Free**. Aucun service payant n’est défini par notre Blueprint.

Conserve la branche proposée pour une version stable publiée. Renseigne les quatre champs :

![Exemple schématique des paramètres Render, avec valeurs fictives et secrets masqués](images/render-settings.fr.svg)

| Clé              | Valeur à saisir                                                                |
| ---------------- | ------------------------------------------------------------------------------ |
| `ZOTERO_USER_ID` | Ton identifiant numérique, sans guillemets                                     |
| `ZOTERO_API_KEY` | La clé dédiée copiée depuis Zotero                                             |
| `OWNER_PASSWORD` | Un nouveau mot de passe d’au moins 20 caractères, différent de celui de Zotero |
| `WRITE_ENABLED`  | Le texte `false`, sans guillemets                                              |

Clique **Deploy Blueprint**. Attends **Live** : **Build successful** seul signifie seulement que la construction du programme est terminée. Si le démarrage échoue, les logs indiquent maintenant le paramètre incomplet. Ne photographie pas les valeurs des secrets.

La page du service donne son adresse `https://…onrender.com`. Ouvre cette adresse suivie de `/health` : tu dois voir `{"status":"ok"}`. Un réveil après mise en veille peut être lent. Cela ne vérifie pas encore la clé Zotero.

## 3. Enregistrer la connexion dans ChatGPT

Ouvre [Plugins](https://chatgpt.com/plugins). Dans le menu **Ajouter**, cherche l’ajout d’un MCP personnalisé ; les libellés peuvent varier selon l’application. Choisis **Diffusion HTTP en continu**, et non **STDIO**.

![Exemple schématique d’une connexion MCP distante](images/mcp-connection.fr.svg)

- Nom : `Zotero Cloud — connexion`.
- Adresse : **ton** adresse Render suivie de `/mcp`.
- Authentification : OAuth si demandé.
- Client ID si demandé : `zotero-cloud-personal`.
- Secret client : vide ; il s’agit d’un client public.

Enregistre puis lance la connexion. La page « Autoriser votre connecteur personnel » doit appartenir à **ton service Render**. Saisis le mot de passe choisi pour `OWNER_PASSWORD`, puis **Autoriser ChatGPT**. Le retour vers ChatGPT doit se faire après un clic. Ne clique pas plusieurs fois si la page paraît bloquée : utilise [le dépannage](troubleshooting.fr.md).

Si ChatGPT indique un autre callback que celui configuré par défaut, reporte son URL exacte dans `OAUTH_REDIRECT_URI` sur Render. Ne publie pas l’URL complète du formulaire OAuth : elle contient des paramètres propres à la demande.

Si l’interface ne propose pas de MCP ou reste bloquée, ne change pas d’abonnement pour ce guide : indique le produit utilisé dans ton retour de test. La disponibilité du parcours doit être vérifiée pour ton compte.

## 4. Vérifier une lecture réelle

Dans une **nouvelle conversation**, sélectionne la connexion avec `@`. Demande :

> Liste trois de mes collections existantes avec leurs identifiants, sans rien modifier.

Puis cherche une référence que tu connais par son DOI ou son titre et compare les résultats avec Zotero Web. Une réponse générale sur un auteur, sans appel d’outil ni résultats de ta bibliothèque, ne valide pas la connexion.

## 5. Autoriser puis tester une seule écriture

Dans Render, ouvre **ton service → Environment → Edit**. La ligne `WRITE_ENABLED` est un **champ texte masqué**, pas une liste déroulante. Remplace `false` par `true`, sans guillemets, puis **Save and deploy**. Attends **Live**. Les autres variables restent inchangées.

Dans ChatGPT :

> Retrouve la notice portant le DOI [DOI d’une référence unique que tu possèdes]. Si elle est unique, propose le texte d’une courte note de validation. Après mon accord, ajoute cette seule note enfant, puis relis les notes pour confirmer qu’elle a été ajoutée une fois. Ne modifie rien d’autre.

Évite une notice factice : le connecteur ne peut pas supprimer la référence ou sa note de test ensuite. Tu peux remettre `WRITE_ENABLED=false` après le test.

## 6. Utiliser le workflow bibliographique

La connexion MCP fournit déjà les huit outils. Tu peux lui demander d’ajouter des références vérifiées, de chercher avant création, de compléter les tags sans retirer les anciens et d’ajouter des notes fondées sur tes sources.

Le [workflow complet](../plugin-template/skills/zotero-library/SKILL.md) peut ensuite être associé à un plugin personnel. Cette étape facultative est documentée dans [Paquet ChatGPT personnel](personal-plugin.fr.md) ; elle ne demande pas un second serveur.

**Installation terminée quand** : le retour OAuth fonctionne, une lecture est confirmée dans Zotero Web, une note contrôlée est retrouvée, et les autres données sont inchangées. Tester ensuite l’application mobile utilisée habituellement avant de déclarer l’usage en mobilité validé.
