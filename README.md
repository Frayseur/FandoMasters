# FandoMasters

Jeu de cartes à collectionner alimenté par les wikis Fandom.

- **Le jeu** : `index.html` (la racine du site).
- **La version de test** : `test/index.html`, servie sur `/test/` avec un bandeau « VERSION TEST ». Elle utilise le vrai serveur et les vrais comptes.
- **La vérification automatique** : à chaque envoi, GitHub charge le jeu dans un navigateur (téléphone et ordinateur) et vérifie qu'il démarre sans aucune erreur. Le résultat s'affiche dans l'onglet **Actions** : ✅ tout va bien, ❌ ne pas mettre en ligne.

La logique du serveur (Supabase) est rangée à part, dans un dépôt privé.
