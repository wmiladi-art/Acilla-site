"""Génère p/<id>.html (aperçu Facebook/Messenger) et img/og/<id>.jpg pour chaque produit.
À relancer après chaque changement de catalogue : python3 outils/pages_partage.py"""
import json, os, html
from PIL import Image
SITE = 'https://acilla-site.onrender.com'
s = open('data/catalogue.js').read(); d = json.loads(s[s.index('{'):s.rindex('}') + 1])
shop = d['boutique']
os.makedirs('p', exist_ok=True); os.makedirs('img/og', exist_ok=True)
def money(n): return f"{n:g} DT" if n > 0 else "Prix sur demande"
for p in d['produits']:
    src = (p['images'][0]['src'] if p['images'] else 'img/047-rituel-dore-des-huiles-vegetales') + '.webp'
    og = f"img/og/{p['id']}.jpg"
    im = Image.open(src).convert('RGB'); im.thumbnail((1080, 1350)); im.save(og, 'JPEG', quality=84, optimize=True, progressive=True)
    w, h = im.size
    desc = (p.get('description') or '').split('. ')[0].rstrip('.')
    title = f"{p['nom']} — {money(p['prix'])}"
    full_desc = f"{desc}. Livraison 7 DT partout en Tunisie, paiement à la livraison. Commande sur WhatsApp {shop['whatsapp_affiche']}."
    url = f"{SITE}/p/{p['id']}.html"; target = f"/#p={p['id']}"
    e = html.escape
    page = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)} · {e(shop['nom'])}</title>
<meta name="description" content="{e(full_desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="product"><meta property="og:site_name" content="{e(shop['nom'])}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(full_desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}/{og}">
<meta property="og:image:width" content="{w}"><meta property="og:image:height" content="{h}">
<meta property="og:image:alt" content="{e(p['nom'])}"><meta property="og:locale" content="fr_FR">
<meta property="product:price:amount" content="{p['prix']}"><meta property="product:price:currency" content="TND">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url={target}">
<script>location.replace({json.dumps(target)});</script>
<style>body{{font-family:system-ui,sans-serif;background:#FBF1EF;color:#3A0F1C;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center}}a{{color:#8E1B33}}</style>
</head><body><p>{e(p['nom'])}<br><a href="{target}">Voir le produit</a></p></body></html>"""
    open(f"p/{p['id']}.html", 'w').write(page)
print(len(d['produits']), 'pages de partage')
