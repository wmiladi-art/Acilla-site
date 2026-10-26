(function () {
  'use strict';
  var C = window.CATALOGUE;
  var shop = C.boutique;
  var products = C.produits;
  var byId = {};
  products.forEach(function (p) { byId[p.id] = p; });

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function money(n) { return n > 0 ? n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 }) + ' DT' : 'Prix sur demande'; }
  function waUrl(text) { return 'https://wa.me/' + shop.whatsapp + '?text=' + encodeURIComponent(text); }

  /* ---------- Infos boutique ---------- */
  $$('[data-shop-name]').forEach(function (e) { e.textContent = shop.nom; });
  $$('[data-shop-sub]').forEach(function (e) { e.textContent = shop.sous_titre; });
  $('[data-wa-link]').href = waUrl('Bonjour, je souhaite des informations sur vos produits Acilla.');
  $('[data-wa-display]').textContent = shop.whatsapp_affiche;
  $('[data-fb-link]').href = shop.facebook;

  /* ---------- Visuels de remplacement ---------- */
  function placeholder(p) {
    var shape;
    if (p.categorie === 'huiles') {
      shape = '<rect x="88" y="34" width="24" height="22" rx="3" class="ph-cap"/><rect x="84" y="54" width="32" height="10" rx="2" class="ph-cap"/><path d="M70 72h60v104a8 8 0 0 1-8 8H78a8 8 0 0 1-8-8z" class="ph-body"/><rect x="78" y="104" width="44" height="46" rx="2" class="ph-label"/>';
    } else {
      shape = '<rect x="60" y="78" width="80" height="20" rx="4" class="ph-cap"/><path d="M56 98h88v70a10 10 0 0 1-10 10H66a10 10 0 0 1-10-10z" class="ph-body"/><rect x="70" y="116" width="60" height="34" rx="2" class="ph-label"/>';
    }
    return '<svg class="ph" viewBox="0 0 200 210" role="img" aria-label="' + esc(p.nom) + ' (photo à venir)">' + shape + '</svg>';
  }
  function thumb(p) {
    if (p.images && p.images.length) return '<img src="' + esc(p.images[0].src) + '-sm.webp" alt="' + esc(p.images[0].alt) + '" loading="lazy" width="640" height="640">';
    return placeholder(p);
  }

  /* ---------- Catalogue ---------- */
  var INTRO = {
    coffrets: 'Un parfum et son soin assorti, dans un écrin prêt à offrir.',
    huiles: 'Flacons de 15 à 200 ml, pour la peau, les cheveux et le massage.',
    soins: 'Soins du visage, du corps et des cheveux : nettoyants, crèmes, sérums, masques, solaires et hydrolats.'
  };
  var state = { cat: 'coffrets', genre: '', sc: '' };
  function render() {
    var list = products.filter(function (p) { return p.categorie === state.cat && (!state.genre || state.cat !== 'coffrets' || p.genre === state.genre || (state.genre !== 'mixte' && p.genre === 'mixte')) && (!state.sc || state.cat !== 'soins' || p.sous_cat === state.sc); });
    if (state.cat === 'huiles') list.sort(function (a, b) { return (b.vedette ? 1 : 0) - (a.vedette ? 1 : 0); });
    $('[data-chips]').hidden = state.cat !== 'coffrets';
    $('[data-chips-soins]').hidden = state.cat !== 'soins';
    $('[data-cat-intro]').textContent = INTRO[state.cat];
    var html = list.map(function (p) {
      var meta = p.contenance || (p.gamme ? 'Gamme ' + p.gamme : (p.contenu || []).join(' + '));
      return '<article class="card' + (p.images.length ? '' : ' card-noimg') + '">' +
        '<button class="card-hit" type="button" data-open="' + esc(p.id) + '" aria-label="Voir ' + esc(p.nom) + '"></button>' +
        '<div class="card-media">' + thumb(p) + '</div>' +
        '<div class="card-body">' +
          '<h3 class="card-title">' + esc(p.nom) + '</h3>' +
          (meta ? '<p class="card-meta">' + esc(meta) + '</p>' : '') +
          '<p class="card-price' + (p.prix > 0 ? '' : ' is-ask') + '">' + (p.variantes.length > 1 && new Set(p.variantes.map(function (v) { return v.prix; })).size > 1 ? 'dès ' : '') + money(p.prix) + '</p>' +
        '</div>' +
        '<button class="card-add" type="button" data-quick="' + esc(p.id) + '">' + (p.variantes.length ? 'Choisir' : 'Ajouter') + '</button>' +
      '</article>';
    }).join('');
    $('[data-grid]').innerHTML = html || '<p class="empty">Aucun produit dans cette sélection. Essayez « Tous ».</p>';
  }
  function setCat(c) {
    state.cat = c;
    $$('[data-cat]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.cat === c)); });
    render();
  }
  $$('[data-cat]').forEach(function (b) { b.addEventListener('click', function () { setCat(b.dataset.cat); }); });
  $$('[data-sc]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.sc = b.dataset.sc;
      $$('[data-sc]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  $$('[data-genre]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.genre = b.dataset.genre;
      $$('[data-genre]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      render();
    });
  });
  $$('[data-jump]').forEach(function (a) { a.addEventListener('click', function () { setCat(a.dataset.jump); }); });
  $('[data-grid]').addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) return openProduct(o.dataset.open);
    var q = e.target.closest('[data-quick]');
    if (q) { var p = byId[q.dataset.quick]; if (p.variantes.length) openProduct(p.id); else { addToCart(p.id, null, 1); } }
  });

  /* ---------- Fiche produit ---------- */
  var pd = $('[data-product-dialog]');
  function openProduct(id) {
    var p = byId[id];
    var imgs = p.images.length ? p.images : null;
    var gallery = imgs
      ? '<div class="pd-main"><img data-pd-main src="' + esc(imgs[0].src) + '.webp" alt="' + esc(imgs[0].alt) + '"></div>' +
        (imgs.length > 1 ? '<div class="pd-thumbs">' + imgs.map(function (im, i) { return '<button type="button" data-pd-thumb="' + i + '" aria-label="Image ' + (i + 1) + '" aria-pressed="' + (i === 0) + '"><img src="' + esc(im.src) + '-sm.webp" alt="" loading="lazy"></button>'; }).join('') + '</div>' : '')
      : '<div class="pd-main pd-ph">' + placeholder(p) + '<p>Photo à venir</p></div>';
    var variants = p.variantes.length ? '<fieldset class="pd-variants"><legend>Version</legend>' + p.variantes.map(function (v, i) {
      return '<label><input type="radio" name="variant" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(v.label) + '<em>' + money(v.prix) + '</em></span></label>';
    }).join('') + '</fieldset>' : '';
    var contenu = p.contenu && p.contenu.length ? '<div class="pd-block"><h3>Dans le coffret</h3><ul data-pd-contenu>' + p.contenu.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>' : '';
    var benef = p.benefices && p.benefices.length ? '<div class="pd-block"><h3>Ce qu’on en dit</h3><ul>' + p.benefices.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>' : '';
    var actifs = p.actifs && p.actifs.length ? '<p class="pd-actifs">Actifs mis en avant : ' + esc(p.actifs.join(', ')) + '</p>' : '';
    $('[data-product-body]').innerHTML =
      '<div class="sheet-head"><span class="pd-cat">' + esc(p.contenance || p.gamme || (p.categorie === 'coffrets' ? 'Coffret' : '')) + '</span><button class="close" type="button" data-close aria-label="Fermer">×</button></div>' +
      '<div class="pd-grid"><div class="pd-gallery">' + gallery + '</div>' +
      '<div class="pd-info"><h2 id="pd-title">' + esc(p.nom) + '</h2>' +
      '<p class="pd-price' + (p.prix > 0 ? '' : ' is-ask') + '" data-pd-price>' + money(p.variantes.length ? p.variantes[0].prix : p.prix) + '</p>' +
      '<p class="pd-desc">' + esc(p.description) + '</p>' + (p.reference ? '<p class="pd-ref">Réf. ' + esc(p.reference) + '</p>' : '') + variants + contenu + benef + actifs +
      '<div class="pd-buy"><label class="qty">Quantité <input type="number" min="1" max="20" value="1" data-pd-qty></label>' +
      '<button class="btn btn-primary" type="button" data-pd-add>Ajouter au panier</button></div>' +
      '<a class="btn btn-ghost pd-wa" target="_blank" rel="noopener" data-pd-wa href="#">Commander ce produit sur WhatsApp</a>' +
      '</div></div>';
    var body = $('[data-product-body]');
    function current() { var r = $('input[name=variant]:checked', body); return r ? +r.value : null; }
    function refresh() {
      var vi = current(); var v = vi == null ? null : p.variantes[vi];
      $('[data-pd-price]', body).textContent = money(v ? v.prix : p.prix);
      if (v && v.contenu && $('[data-pd-contenu]', body)) $('[data-pd-contenu]', body).innerHTML = v.contenu.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
      var q = Math.max(1, +$('[data-pd-qty]', body).value || 1);
      $('[data-pd-wa]', body).href = waUrl('Bonjour, je souhaite commander :\n- ' + q + ' × ' + p.nom + (v ? ' (' + v.label + ')' : '') + (p.reference ? ' [réf. ' + p.reference + ']' : '') + ' — ' + money(v ? v.prix : p.prix) + '\nLivraison : ' + shop.livraison_tnd + ' DT\n\nNom :\nTéléphone :\nAdresse :');
    }
    body.addEventListener('change', refresh);
    body.addEventListener('input', refresh);
    body.addEventListener('click', function (e) {
      var t = e.target.closest('[data-pd-thumb]');
      if (t) {
        var im = imgs[+t.dataset.pdThumb];
        var main = $('[data-pd-main]', body); main.src = im.src + '.webp'; main.alt = im.alt;
        $$('[data-pd-thumb]', body).forEach(function (b) { b.setAttribute('aria-pressed', String(b === t)); });
      }
      if (e.target.closest('[data-pd-add]')) { addToCart(p.id, current(), Math.max(1, +$('[data-pd-qty]', body).value || 1)); pd.close(); }
    });
    refresh();
    pd.showModal();
  }

  /* ---------- Panier ---------- */
  var cart = store('acilla-cart') || [];
  cart = cart.filter(function (l) { return byId[l.id]; });
  function lineInfo(l) {
    var p = byId[l.id]; var v = l.v != null ? p.variantes[l.v] : null;
    return { p: p, label: p.nom + (v ? ' (' + v.label + ')' : '') + (p.reference ? ' [réf. ' + p.reference + ']' : ''), prix: v ? v.prix : p.prix };
  }
  function save() { store('acilla-cart', cart); var n = cart.reduce(function (s, l) { return s + l.q; }, 0); $('[data-cart-count]').textContent = n; $('[data-cart-count]').classList.toggle('has', n > 0); }
  function toast(msg) { var t = $('[data-toast]'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 2200); }
  function addToCart(id, v, q) {
    var ex = cart.filter(function (l) { return l.id === id && l.v === v; })[0];
    if (ex) ex.q += q; else cart.push({ id: id, v: v, q: q });
    save(); toast(byId[id].nom + ' ajouté au panier');
  }
  function renderCart() {
    var body = $('[data-cart-body]');
    if (!cart.length) { body.innerHTML = '<p class="empty">Votre panier est vide. Parcourez le catalogue et ajoutez vos produits.</p>'; return; }
    var sub = 0, ask = false;
    var rows = cart.map(function (l, i) {
      var x = lineInfo(l); if (x.prix > 0) sub += x.prix * l.q; else ask = true;
      return '<li class="cl"><div class="cl-name">' + esc(x.label) + '<span>' + money(x.prix) + '</span></div>' +
        '<div class="cl-qty"><button type="button" data-dec="' + i + '" aria-label="Retirer un">−</button><span>' + l.q + '</span><button type="button" data-inc="' + i + '" aria-label="Ajouter un">+</button></div></li>';
    }).join('');
    body.innerHTML = '<ul class="cart-lines">' + rows + '</ul>' +
      '<dl class="totals"><div><dt>Sous-total</dt><dd>' + money(sub) + (ask ? ' + prix à confirmer' : '') + '</dd></div>' +
      '<div><dt>Livraison</dt><dd>' + shop.livraison_tnd + ' DT</dd></div>' +
      '<div class="grand"><dt>Total</dt><dd>' + money(sub + shop.livraison_tnd) + (ask ? ' + prix à confirmer' : '') + '</dd></div></dl>' +
      '<form class="cart-form" data-cart-form><p class="cf-note">Facultatif : remplissez ces champs, ils seront ajoutés à votre message.</p>' +
      '<label>Nom<input name="nom" autocomplete="name"></label>' +
      '<label>Téléphone<input name="tel" type="tel" autocomplete="tel"></label>' +
      '<label>Adresse et ville<input name="adresse" autocomplete="street-address"></label>' +
      '<button class="btn btn-primary btn-wa" type="submit">Envoyer ma commande sur WhatsApp</button>' +
      '<p class="cf-note">Paiement à la livraison. Retour sous 7 jours.</p></form>';
  }
  $('[data-cart-body]').addEventListener('click', function (e) {
    var d = e.target.closest('[data-dec]'), u = e.target.closest('[data-inc]');
    if (d) { var i = +d.dataset.dec; cart[i].q -= 1; if (cart[i].q <= 0) cart.splice(i, 1); }
    else if (u) { cart[+u.dataset.inc].q += 1; } else return;
    save(); renderCart();
  });
  $('[data-cart-body]').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(e.target), sub = 0, ask = false;
    var lines = cart.map(function (l) { var x = lineInfo(l); if (x.prix > 0) sub += x.prix * l.q; else ask = true; return '- ' + l.q + ' × ' + x.label + ' — ' + money(x.prix); });
    var msg = 'Bonjour, je souhaite commander :\n' + lines.join('\n') +
      '\n\nSous-total : ' + money(sub) + (ask ? ' (+ prix à confirmer)' : '') +
      '\nLivraison : ' + shop.livraison_tnd + ' DT\nTotal : ' + money(sub + shop.livraison_tnd) + (ask ? ' (+ prix à confirmer)' : '') +
      '\n\nNom : ' + (f.get('nom') || '') + '\nTéléphone : ' + (f.get('tel') || '') + '\nAdresse : ' + (f.get('adresse') || '');
    window.open(waUrl(msg), '_blank', 'noopener');
  });
  var cd = $('[data-cart-dialog]');
  $('[data-open-cart]').addEventListener('click', function () { renderCart(); cd.showModal(); });

  /* ---------- Fermeture des fenêtres ---------- */
  [pd, cd].forEach(function (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  });

  save();
  render();
})();
