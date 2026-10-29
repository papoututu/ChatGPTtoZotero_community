[Français](SECURITY.fr.md) · [English](SECURITY.md)

<a id="content"></a>

# Signaler un problème de sécurité

Ne publie jamais de clé, mot de passe, contenu de bibliothèque ou URL de consentement dans un ticket.

Si le dépôt propose le signalement privé des vulnérabilités GitHub, utilise cette fonction. Sinon, ouvre un ticket indiquant seulement que tu souhaites un canal privé de signalement, sans décrire publiquement une exploitation ni ses secrets. Le mainteneur doit confirmer un canal privé avant l’envoi des détails.

En cas de clé exposée, commence par la révoquer dans Zotero. Le mot de passe du connecteur et le secret de signature se changent dans Render ; changer le secret de signature invalide les tokens MCP. Le serveur n’est pas conçu comme un service multiutilisateur.
