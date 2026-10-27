# À faire — site Écrin Beauté (revendeur Acilla)

## Décisions
- [x] Maquette choisie : couleurs rouge vin et rose, photos en arche, accueil trio d'huiles.
- [ ] **Nom de la boutique** : « Écrin Beauté » est provisoire (modifiable dans `data/catalogue.js`, champ `boutique.nom`).
- [ ] **Nom de domaine** : aucun pour l'instant. Le site est sur l'adresse `onrender.com`.

## Prix à compléter (affichés « Prix sur demande », valeur 0 DT dans les données)
- [ ] Gamme Capillaire Anti-chute : shampoing, sérum, masque (3 articles, absents du fichier acilla.com, sans photo).

## Prix à confirmer
- [ ] Coffrets : prix repris de mars 2026 (65 DT, sauf Daily Repair 50 DT et Orientale ancien emballage 50 DT).
- [ ] Essoltane : 60 DT sur les affiches d'août, 65 DT ensuite. Le site affiche 65 DT.
- [ ] Coffret Sérums : 65 DT (stock de mars) ou 50 DT (affiches d'octobre) ? Le site affiche 65 DT.
- [ ] Huiles et soins : prix acilla.com −20 %, arrondis au dinar inférieur (relevé du 26/10/2026). À revoir si acilla.com change ses prix.
- [ ] Plusieurs affiches affichent un prix écrit dans l'image (60/65/50 DT, offre « 2 coffrets à 105 DT »). Vérifier qu'il correspond au prix du site.

## Contenu
- [ ] Coffret Miss Acilla : confirmer quelle version correspond à cof15 et à cof16 (parfum + déodorant / parfum + lait corps).
- [x] Visuels des 20 huiles créés à partir des photos acilla.com (flacon détouré, fond doré, socle, 3 bienfaits).
- [x] 45 soins de la peau intégrés depuis acilla.com (prix −20 %, références, descriptions) avec 44 visuels au même style que les huiles.
- [ ] Soin Anti-Cernes (réf. 10029) : la photo d'acilla.com montre un « Soin fortifiant cils », et la référence est la même que le Soin Fortifiant Sourcils. Produit affiché sans photo : vérifier ce qu'il est vraiment.
- [ ] Corrections faites sur les textes d'acilla.com : Eau Micellaire Anti-Taches (le site affiche le texte de la mousse, texte réécrit), Gel Nettoyant (« Lait » remplacé par « Gel »), Hydrolat d'Oliban (« cicatrisantes » retiré). Mousse et Eau Micellaire Anti-Taches ont la même référence 1010040 sur acilla.com.
- [x] 118 affiches retravaillées (27/10/2026) placées en première image de 59 produits, les anciens visuels restant dans la fiche.
- [ ] 18 de ces affiches sont marquées « à confirmer » dans leur livraison : contenances (Dattes, Figue de Barbarie, Souchet, Baume à lèvres 4 g ?, Eau micellaire démaquillante 50 ou 200 ml ?, Lait démaquillant 50 ou 150 ml ?) et mode d'emploi des 3 argiles (pot prêt à l'emploi ou poudre à mélanger ?).
- [ ] Sans affiche retravaillée : Pépin de Raisin, Pépins de Courge, Gel Nettoyant, Eau Micellaire Anti-Taches, Daily Repair Jour, Soin Anti-Cernes (ils gardent mes visuels).
- [ ] Photos du Cocktail 5en1 et de la gamme capillaire (un dessin neutre est affiché en attendant).
- [ ] Cocktail d'Huiles Précieuses 5en1 : absent du fichier extrait du site. Il manque sa référence et sa description officielle.
- [x] Descriptions et références des 20 autres huiles reprises du site acilla.com (26/10/2026). Textes retouchés : Cresson et Pépins de Courge (affirmations médicales retirées), Pépin de Raisin et Arachide (« traiter l'acné » adouci), Jojoba (le site acilla.com affiche par erreur le texte du Fenugrec, donc la description d'origine est conservée).
- [ ] Contenances (ml) des parfums, déodorants et soins, composition (INCI), mode d'emploi.
- [x] Contenance de Souchet, Noyaux de Dattes et Figue de Barbarie : 15 ml (vérifié sur les étiquettes).
- [ ] Ajouter de vrais avis clients quand il y en aura. Les témoignages et avant/après générés par IA ont été retirés volontairement.

## Technique
- [ ] **Base de données (commandes, stocks)** : mise de côté pour l'instant. Le compte Supabase gratuit actuel a déjà 2 projets actifs (limite de l'offre gratuite).
  Options : (1) nouveau compte Supabase dédié à Acilla, (2) alternative gratuite sans changer de compte : Neon (Postgres), Firebase, PocketBase sur Render, ou Postgres gratuit de Render (expire après 30 jours sur l'offre gratuite).
- [ ] Le panier est enregistré dans le navigateur du client et la commande part sur WhatsApp. Il n'y a aucun suivi des commandes côté boutique pour l'instant.
