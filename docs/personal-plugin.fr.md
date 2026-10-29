[Français](personal-plugin.fr.md) · [English](personal-plugin.md)

<a id="content"></a>

# Le plugin ChatGPT : ce qui existe déjà et ce qu’il reste à associer

**Aucun serveur supplémentaire à développer.** L’ajout du MCP dans ChatGPT donne déjà les huit outils de ce projet. Le paquet facultatif ajoute les consignes bibliographiques réutilisables.

Une déclaration d’adresse dans `mcp.json` ne remplace pas nécessairement l’enregistrement de la connexion dans l’interface ChatGPT. Pour le parcours validé par le développeur, il faut d’abord enregistrer le MCP, terminer OAuth, puis associer l’application créée au workflow.

## Pour une personne non technique

Commence avec la connexion MCP seule et les exemples du guide d’installation. Ensuite, demande à Plugin Creator d’associer [ce workflow](../plugin-template/skills/zotero-library/SKILL.md) à **ta connexion existante**. Fournis son identifiant public d’application visible dans « Afficher les détails », commençant par `asdk_app_`. Ne fournis aucune clé ni mot de passe. Si tu as déjà créé ton plugin personnel, demande de le mettre à jour, sans le recréer.

## Pour préparer automatiquement les fichiers

Une seule commande, exécutée à la racine du code téléchargé :

```sh
npm run package:plugin -- --url https://YOUR-SERVICE.onrender.com --app-id asdk_app_YOUR_VERIFIED_ID --archive
```

Le dossier `dist/zotero-cloud` contient :

- `plugin.json` : identité et description du workflow ;
- `mcp.json` : ton adresse MCP et les paramètres OAuth publics ;
- `.app.json` : **ton** application enregistrée dans ChatGPT ;
- `skills/zotero-library/SKILL.md` : méthode bibliographique.

Le script refuse d’écraser un dossier existant. L’option `--archive` nécessite la commande système `tar`. L’import du paquet via Plugin Creator reste une étape distincte ; il ne s’agit pas d’une publication dans le répertoire public.

Ne redistribue pas ton paquet personnalisé comme un paquet universel : son adresse et son application renvoient à ton installation. Redistribue le **modèle et le générateur**, qui ne sont associés à aucun compte.
