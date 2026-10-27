# Écrin Beauté — site vitrine (revendeur Acilla)

Site statique, sans étape de build : `index.html`, `css/`, `js/app.js`, catalogue dans `data/catalogue.js`, images WebP dans `img/`.

- Modifier un prix ou un produit : `data/catalogue.js`.
- Commande : panier → message WhatsApp pré-rempli vers +216 40 765 356.
- Thème : `css/theme.css` (couleurs rouge vin et rose, photos en arche).
- Déploiement : Render, Static Site, publish path `.`, sans build.

Voir `A_FAIRE.md` pour la liste des points ouverts.

## Partage sur les réseaux
- Chaque fiche produit a un bloc « Partager cette photo » (Facebook, Messenger, Instagram, TikTok, WhatsApp, téléchargement, lien).
- Lien direct d'un produit : `https://acilla-site.onrender.com/p/<identifiant>.html` (aperçu avec photo, nom et prix pour Facebook/Messenger), qui redirige vers `/#p=<identifiant>`.
- Après tout changement de produits, de prix ou d'images : `python3 outils/pages_partage.py` pour régénérer `p/` et `img/og/`.
- Si le site change d'adresse (nom de domaine), modifier `SITE` dans `outils/pages_partage.py` et dans `js/app.js`.
