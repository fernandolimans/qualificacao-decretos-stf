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
    telas.forEach(function (t, j) { t.classList.toggle("ativo", j === atual); });
    n.hidden = atual === 0;
    n.textContent = pad(atual) + " / " + pad(telas.length - 1);
    if (history.replaceState) history.replaceState(null, "", atual ? "#tela-" + atual : location.pathname + location.search);
  }

  /* Ao avançar para uma tela que tem foto de transição, a foto aparece por um instante e a tela entra por baixo dela.
     Outra tecla durante a transição a encerra na hora. Voltar, Home, End e o endereço da tela não passam pela foto. */
  var trans = document.getElementById("cs-trans"), trImg = trans && trans.querySelector("img"), emTrans = null;
  function fimTrans() {
    if (!emTrans) return;
    clearTimeout(emTrans.t1); clearTimeout(emTrans.t2);
    if (atual !== emTrans.alvo) mostrar(emTrans.alvo);
    trans.classList.remove("on", "sai"); trans.hidden = true; emTrans = null;
  }
  function avancar() {
    if (emTrans) { fimTrans(); return; }
    var k = atual + 1;
    if (k >= telas.length) return;
    var src = trans && telas[k].dataset.trans;
    if (!src) { mostrar(k); return; }
    trImg.src = src;
    trImg.style.objectFit = telas[k].dataset.transFit || "cover";
    trImg.style.objectPosition = telas[k].dataset.transPos || "center";
    trans.hidden = false; void trans.offsetWidth; trans.classList.add("on");
    emTrans = { alvo: k };
    emTrans.t1 = setTimeout(function () { mostrar(k); trans.classList.add("sai"); }, 1350);
    emTrans.t2 = setTimeout(function () { trans.classList.remove("on", "sai"); trans.hidden = true; emTrans = null; }, 1950);
  }
  /* as fotos de transição são carregadas logo, para aparecerem sem espera */
  window.addEventListener("load", function () {
    telas.forEach(function (t) { if (t.dataset.trans) { var i = new Image(); i.src = t.dataset.trans; } });
  });

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
