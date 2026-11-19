/* Apresentação curta: setas, espaço e Page Up/Down trocam de tela; F põe em tela cheia.
   As telas completas ficam escondidas e abrem só pelo número da página (clique) ou pela tecla R,
   na seção correspondente à tela atual. Esc volta à apresentação. */
(function () {
  "use strict";
  var telas = Array.prototype.slice.call(document.querySelectorAll(".cs-slide"));
  var n = document.getElementById("cs-n");
  var reserva = document.getElementById("reserva");
  var fechar = document.getElementById("cs-fechar");
  var paineis = Array.prototype.slice.call(reserva.querySelectorAll(".painel"));
  var atual = 0, aberto = null;
  var pad = function (k) { return (k < 10 ? "0" : "") + k; };

  function mostrar(k) {
    atual = Math.max(0, Math.min(telas.length - 1, k));
    telas.forEach(function (t, j) { t.classList.toggle("ativo", j === atual); if (j !== atual) t.classList.remove("sem-subir"); });
    n.hidden = atual === 0;
    n.textContent = pad(atual) + " / " + pad(telas.length - 1);
    if (history.replaceState) history.replaceState(null, "", atual ? "#tela-" + atual : location.pathname + location.search);
    caber(telas[atual]);
  }

  /* Com menos texto (19/11/2026), o conteúdo de cada tela cresce por igual até ocupar a altura disponível,
     sem passar dela e sem mudar nenhuma palavra. A capa, as Referências e as telas estreitas (celular) não mudam. */
  function caber(t) {
    if (!t || t.classList.contains("cs-capa") || t.classList.contains("cs-7")) return;
    t.style.setProperty("--z", "1");
    if (innerWidth <= 900) return;
    var filhos = Array.prototype.slice.call(t.children), cs = getComputedStyle(t);
    var disp = t.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var gap = parseFloat(cs.rowGap) || 0;
    function alt() { var a = gap * (filhos.length - 1); filhos.forEach(function (c) { a += c.getBoundingClientRect().height; }); return a; }
    if (alt() >= disp * 0.94) return;
    var lo = 1, hi = 1.4;
    for (var i = 0; i < 8; i++) {
      var m = (lo + hi) / 2; t.style.setProperty("--z", String(m));
      if (alt() <= disp * 0.94) lo = m; else hi = m;
    }
    t.style.setProperty("--z", String(lo));
  }
  var tRes = null;
  window.addEventListener("resize", function () { clearTimeout(tRes); tRes = setTimeout(function () { caber(telas[atual]); }, 120); });

  /* Ao avançar para uma tela que tem foto de transição, a foto entra pela direita por cima da tela atual e, logo depois,
     a tela seguinte entra pela direita por cima da foto, como lâminas. Tudo acontece sozinho, sem segundo clique.
     Outra tecla durante a transição a encerra na hora. Voltar, Home, End e o endereço da tela não passam pela foto. */
  var trans = document.getElementById("cs-trans"), emTrans = null;
  var palco = document.getElementById("cs"), corpo = document.body;
  var FOTO_SO = 1150, LAMINA = 850;
  /* uma imagem para cada foto, criada e carregada logo, para que nunca apareça por um instante a foto da transição anterior */
  var fotos = {};
  if (trans) telas.forEach(function (t, j) {
    if (!t.dataset.trans) return;
    var im = document.createElement("img");
    im.alt = ""; im.decoding = "async"; im.src = t.dataset.trans;
    im.style.objectFit = t.dataset.transFit || "cover"; im.style.objectPosition = t.dataset.transPos || "center";
    trans.appendChild(im); fotos[j] = im;
  });
  function limparTrans() {
    palco.classList.remove("cs-lamina"); corpo.classList.remove("em-lamina");
    trans.classList.remove("on", "cobre"); trans.hidden = true;
  }
  function fimTrans() {
    if (!emTrans) return;
    clearTimeout(emTrans.t1); clearTimeout(emTrans.t2);
    if (atual !== emTrans.alvo) { mostrar(emTrans.alvo); telas[emTrans.alvo].classList.add("sem-subir"); }
    limparTrans(); emTrans = null;
  }
  function avancar() {
    if (emTrans) { fimTrans(); return; }
    var k = atual + 1;
    if (k >= telas.length) return;
    var im = fotos[k];
    if (!im) { mostrar(k); return; }
    var este = emTrans = { alvo: k };
    Object.keys(fotos).forEach(function (j) { fotos[j].classList.toggle("vis", +j === k); });
    /* a lâmina só começa a entrar quando a foto já está pronta para ser desenhada, para não passar uma faixa escura */
    function comecar() {
      if (emTrans !== este || este.iniciou) return;
      este.iniciou = true;
      corpo.classList.add("em-lamina");
      trans.hidden = false; void trans.offsetWidth; trans.classList.add("on");
      este.t1 = setTimeout(function () {
        mostrar(k); telas[k].classList.add("sem-subir");
        void palco.offsetWidth; palco.classList.add("cs-lamina"); trans.classList.add("cobre");
      }, FOTO_SO);
      este.t2 = setTimeout(function () { limparTrans(); emTrans = null; }, FOTO_SO + LAMINA + 40);
    }
    var pronto = im.complete && im.naturalWidth
      ? (im.decode ? im.decode() : Promise.resolve())
      : new Promise(function (r) { im.addEventListener("load", r, { once: true }); im.addEventListener("error", r, { once: true }); });
    pronto.then(comecar, comecar);
    setTimeout(comecar, 900);
  }
  function abrir(id, tela) {
    var alvo = id || (telas[atual] && telas[atual].dataset.reserva) || "justificativa";
    var p = document.getElementById(alvo);
    if (!p || !p.classList.contains("painel")) return;
    paineis.forEach(function (q) { q.classList.toggle("ativo", q === p); q.classList.remove("entrou"); });
    void p.offsetWidth; p.classList.add("entrou");
    reserva.hidden = false; aberto = alvo; reserva.scrollTop = 0;
    var ctl = window.etapasPainel && window.etapasPainel[alvo];
    if (ctl) { if (tela != null && tela !== "") ctl.ir(+tela); else ctl.entrar(1); }
  }
  function voltar() { reserva.hidden = true; aberto = null; n.focus({ preventScroll: true }); }

  n.addEventListener("click", function () { fimTrans(); abrir(); });
  fechar.addEventListener("click", voltar);
  var descer = document.getElementById("descer");
  if (descer) descer.addEventListener("click", function () { if (atual === 0) avancar(); else mostrar(1); });

  /* links entre seções dentro da reserva */
  reserva.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1), p = document.getElementById(id);
    if (p && p.classList.contains("painel")) { e.preventDefault(); abrir(id, a.dataset.tela); }
  });

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest("input, select, textarea")) return;
    var k = e.key;
    if (k === "f" || k === "F") { tela(); return; }
    if (emTrans && (k === "r" || k === "R" || k === "Escape")) fimTrans();
    if (aberto) {
      var ctl = window.etapasPainel && window.etapasPainel[aberto];
      if (k === "Escape") { e.preventDefault(); voltar(); }
      else if ((k === "ArrowRight" || k === "PageDown") && ctl) { e.preventDefault(); ctl.avancar(); }
      else if ((k === "ArrowLeft" || k === "PageUp") && ctl) { e.preventDefault(); ctl.voltar(); }
      return;
    }
    if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); avancar(); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); fimTrans(); mostrar(atual - 1); }
    else if (k === "Home") { e.preventDefault(); fimTrans(); mostrar(0); }
    else if (k === "End") { e.preventDefault(); fimTrans(); mostrar(telas.length - 1); }
    else if (k === "r" || k === "R") { e.preventDefault(); abrir(); }
  });

  /* tela cheia */
  var btnTela = document.getElementById("btn-tela");
  function tela() {
    if (!document.documentElement.requestFullscreen) return;
    if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen();
  }
  if (btnTela) {
    if (!document.documentElement.requestFullscreen) btnTela.style.display = "none";
    btnTela.addEventListener("click", tela);
    document.addEventListener("fullscreenchange", function () {
      var s = btnTela.querySelector("span");
      if (s) s.textContent = document.fullscreenElement ? "Sair da tela cheia" : "Tela cheia";
    });
  }

  function doHash() { var m = /^#tela-(\d+)$/.exec(location.hash); return m ? +m[1] : 0; }
  window.addEventListener("hashchange", function () { if (!aberto) mostrar(doHash()); });
  mostrar(doHash());
})();
