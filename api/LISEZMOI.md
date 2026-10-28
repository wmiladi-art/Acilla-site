# API de la boutique (Neon Function « boutique »)

- Projet Neon : `ecrin-beaute` (ancient-king-21922582), région eu-central-1, branche `main` (br-raspy-moon-b95u9uk2).
- URL : https://br-raspy-moon-b95u9uk2-boutique.compute.c-7.eu-central-1.aws.neon.tech
- Aucune dépendance : SQL via l'endpoint HTTP de Neon, jetons HMAC-SHA256, mots de passe scrypt.
- Tables : `produits` (prix, stock, visibilité, variantes), `commandes`, `reglages` (mot de passe admin chiffré, clé de session, livraison, compteur).
- Routes publiques : `GET /api/catalogue`, `POST /api/commandes`.
- Routes admin (jeton Bearer, 12 h) : `POST /api/admin/connexion`, `GET /api/admin/resume`, `GET|PATCH /api/admin/commandes`, `GET|PATCH /api/admin/produits`, `POST /api/admin/mot-de-passe`.
- Stock : retiré quand une commande passe en « confirmée », remis si elle est annulée ensuite. Stock vide = illimité.
- Autotest : `POST /api/autotest`, actif uniquement si `reglages.autotest_actif = '1'` (désactivé en production).
- Déploiement : zipper `index.mjs` et le publier sur la function `boutique` (outil MCP `deploy_function` ou `neon functions deploy boutique --src api/index.mjs`).
