# À faire — site Écrin Beauté (revendeur Acilla)

## Décisions
- [x] Maquette choisie : couleurs rouge vin et rose, photos en arche, accueil trio d'huiles.
- [ ] **Nom de la boutique** : « Écrin Beauté » est provisoire (modifiable dans `data/catalogue.js`, champ `boutique.nom`).
- [ ] **Nom de domaine** : aucun pour l'instant. Le site est sur l'adresse `onrender.com`.

## Prix à compléter (affichés « Prix sur demande », valeur 0 DT dans les données)
- [ ] Gamme Rétinol et Acide Hyaluronique : sérum, eau micellaire, mousse nettoyante, crème de jour, masque (5 articles)
- [ ] Gamme Anti-acné : sérum, eau micellaire, mousse nettoyante, crème de jour, masque (5 articles)
- [ ] Gamme Capillaire Anti-chute : shampoing, sérum, masque (3 articles)

## Prix à confirmer
- [ ] Coffrets : prix repris de mars 2026 (65 DT, sauf Daily Repair 50 DT et Orientale ancien emballage 50 DT).
- [ ] Essoltane : 60 DT sur les affiches d'août, 65 DT ensuite. Le site affiche 65 DT.
- [ ] Coffret Sérums : 65 DT (stock de mars) ou 50 DT (affiches d'octobre) ? Le site affiche 65 DT.
- [ ] Huiles : prix acilla.com −20 %, arrondis au dinar inférieur (relevé du 26/10/2026). À revoir si acilla.com change ses prix.
- [ ] Plusieurs affiches affichent un prix écrit dans l'image (60/65/50 DT, offre « 2 coffrets à 105 DT »). Vérifier qu'il correspond au prix du site.

## Contenu
- [ ] Coffret Miss Acilla : confirmer quelle version correspond à cof15 et à cof16 (parfum + déodorant / parfum + lait corps).
- [ ] Photos des 18 huiles sans visuel et des 13 articles de soin (un dessin neutre est affiché en attendant). Les adresses des photos acilla.com sont enregistrées dans `data/catalogue.js` (champ `photo_acilla`). Il reste à les télécharger ou à les lier, avec l'accord d'Acilla de préférence.
- [ ] Cocktail d'Huiles Précieuses 5en1 : absent du fichier extrait du site. Il manque sa référence et sa description officielle.
- [x] Descriptions et références des 20 autres huiles reprises du site acilla.com (26/10/2026). Textes retouchés : Cresson et Pépins de Courge (affirmations médicales retirées), Pépin de Raisin et Arachide (« traiter l'acné » adouci), Jojoba (le site acilla.com affiche par erreur le texte du Fenugrec, donc la description d'origine est conservée).
- [ ] Contenances (ml) des parfums, déodorants et soins, composition (INCI), mode d'emploi.
- [ ] Contenance réelle de Souchet et Noyaux de Dattes (15 ml dans le titre acilla.com, 30 ml dans l'adresse de la page).
- [ ] Ajouter de vrais avis clients quand il y en aura. Les témoignages et avant/après générés par IA ont été retirés volontairement.

## Technique
- [ ] **Base de données (commandes, stocks)** : mise de côté pour l'instant. Le compte Supabase gratuit actuel a déjà 2 projets actifs (limite de l'offre gratuite).
  Options : (1) nouveau compte Supabase dédié à Acilla, (2) alternative gratuite sans changer de compte : Neon (Postgres), Firebase, PocketBase sur Render, ou Postgres gratuit de Render (expire après 30 jours sur l'offre gratuite).
- [ ] Le panier est enregistré dans le navigateur du client et la commande part sur WhatsApp. Il n'y a aucun suivi des commandes côté boutique pour l'instant.
