(function () {
  "use strict";
  var paineis = Array.prototype.slice.call(document.querySelectorAll(".painel"));
  var total = paineis.length;
  var atual = -1;
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var fmt = function (n) { return Math.round(n).toLocaleString("pt-BR"); };
  var trilho = document.getElementById("trilho");
  var contador = document.getElementById("contador");
  var btnAnt = document.getElementById("ant"), btnProx = document.getElementById("prox");
  var ancora = document.getElementById("ancora-abas");

  /* Abas, uma por painel */
  var abas = paineis.map(function (p, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "aba"; b.id = "aba-" + p.id;
    b.setAttribute("role", "tab"); b.setAttribute("aria-controls", p.id); b.setAttribute("aria-selected", "false");
    b.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-' + p.dataset.icone + '"/></svg>' + p.dataset.rotulo;
    b.addEventListener("click", function () { mostrar(i, true); });
    p.setAttribute("aria-labelledby", b.id);
    trilho.appendChild(b);
    return b;
  });

  /* Contagem dos números */
  function contar(el) {
    var alvo = +el.dataset.count; if (!alvo) return;
    if (reduzir) { el.textContent = fmt(alvo); return; }
    var t0 = null, dur = 850, id = (el._id = (el._id || 0) + 1);
    function passo(t) {
      if (el._id !== id) return;
      if (!t0) t0 = t;
      var x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 3);
      el.textContent = fmt(alvo * e);
      if (x < 1) requestAnimationFrame(passo); else el.textContent = fmt(alvo);
    }
    requestAnimationFrame(passo);
  }

  function mostrar(i, rolar, direcao) {
    i = Math.max(0, Math.min(total - 1, i));
    if (i === atual) return;
    atual = i;
    paineis.forEach(function (p, k) {
      var on = k === i;
      p.classList.toggle("ativo", on);
      p.classList.remove("entrou");
      abas[k].setAttribute("aria-selected", on ? "true" : "false");
      abas[k].tabIndex = on ? 0 : -1;
    });
    var p = paineis[i];
    void p.offsetWidth; p.classList.add("entrou");
    p.querySelectorAll("[data-count]").forEach(contar);
    var ctl = window.etapasPainel && window.etapasPainel[p.id];
    if (ctl) ctl.entrar(direcao || 0);
    contador.textContent = pad(i + 1) + " / " + pad(total);
    btnProx.disabled = i === total - 1;
    var aba = abas[i];
    trilho.scrollTo({ left: aba.offsetLeft - (trilho.clientWidth - aba.offsetWidth) / 2, behavior: reduzir ? "auto" : "smooth" });
    if (rolar) {
      if (history.replaceState) history.replaceState(null, "", "#" + p.id);
      irPara(topoAbas(), naCapa());
    }
  }

  /* A capa funciona como a primeira tela: avançar a partir dela mostra a seção aberta,
     e voltar a partir da primeira seção mostra a capa */
  function topoAbas() { return ancora.getBoundingClientRect().top + window.scrollY - 16; }
  function naCapa() { return window.scrollY < topoAbas() - 40; }
  function irPara(y, suave) {
    if (Math.abs(window.scrollY - y) < 2) return;
    window.scrollTo({ top: y, behavior: suave && !reduzir ? "smooth" : "instant" });
  }
  function etapas() { return window.etapasPainel && window.etapasPainel[paineis[atual].id]; }
  function avancar() {
    if (naCapa()) { irPara(topoAbas(), true); return; }
    var ctl = etapas();
    if (ctl && ctl.avancar()) { irPara(topoAbas(), false); return; }
    mostrar(atual + 1, true, 1);
  }
  function voltar() {
    if (naCapa()) return;
    if (atual === 0) { irPara(0, true); if (history.replaceState) history.replaceState(null, "", location.pathname + location.search); }
    else {
      var ctl = etapas();
      if (ctl && ctl.voltar()) { irPara(topoAbas(), false); return; }
      mostrar(atual - 1, true, -1);
    }
  }
  btnAnt.addEventListener("click", voltar);
  btnProx.addEventListener("click", avancar);
  var descer = document.getElementById("descer");
  if (descer) descer.addEventListener("click", function () { irPara(topoAbas(), true); });
  trilho.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault(); e.stopPropagation();
      mostrar(atual + (e.key === "ArrowRight" ? 1 : -1), true); abas[atual].focus();
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input, select, textarea")) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); avancar(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); voltar(); }
    else if (e.key === "Home") { e.preventDefault(); irPara(0, true); }
    else if (e.key === "f" || e.key === "F") { btnTela && btnTela.click(); }
  });
  window.addEventListener("hashchange", function () {
    var k = paineis.findIndex(function (p) { return "#" + p.id === location.hash; });
    if (k >= 0) mostrar(k, true);
  });

  /* Tela cheia */
  var btnTela = document.getElementById("btn-tela");
  if (btnTela) {
    if (!document.documentElement.requestFullscreen) btnTela.style.display = "none";
    btnTela.addEventListener("click", function () {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    });
    document.addEventListener("fullscreenchange", function () {
      btnTela.querySelector("span").textContent = document.fullscreenElement ? "Sair da tela cheia" : "Tela cheia";
    });
  }

  /* Gráfico das ações por ano (preliminar, calculado da planilha) */
  var grafico = document.getElementById("grafico-anos");
  function desenharGrafico() {
    if (!grafico || !window.ACOES) return;
    var cont = {}, semData = 0;
    window.ACOES.forEach(function (a) { if (a.ano) cont[a.ano] = (cont[a.ano] || 0) + 1; else semData++; });
    var anos = []; for (var y = 1988; y <= 2025; y++) anos.push(y);
    var W = 660, H = 300, ml = 32, mr = 8, mt = 30, mb = 44, pw = W - ml - mr, ph = H - mt - mb;
    var maxv = Math.max.apply(null, anos.map(function (a) { return cont[a] || 0; }));
    var vmax = Math.ceil((maxv + 1) / 5) * 5;
    var passo = pw / anos.length, larg = Math.min(15, passo - 4);
    var yv = function (v) { return mt + ph - v / vmax * ph; };
    var html = "";
    for (var v = 0; v <= vmax; v += 5) {
      html += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yv(v) + '" y2="' + yv(v) + '" stroke="#cbd5e1" stroke-dasharray="3 3"/>';
      html += '<text x="' + (ml - 8) + '" y="' + (yv(v) + 4) + '" text-anchor="end" font-size="12" fill="#64748b">' + v + "</text>";
    }
    var desde = 0;
    anos.forEach(function (a, i) {
      var n = cont[a] || 0, x = ml + i * passo + (passo - larg) / 2;
      if (a >= 2019) desde += n;
      if (n) {
        var y0 = yv(0), y1 = yv(n), h = y0 - y1, r = Math.min(4, h / 2);
        var d = "M" + x + "," + y0 + " V" + (y1 + r) + " Q" + x + "," + y1 + " " + (x + r) + "," + y1 + " H" + (x + larg - r) +
                " Q" + (x + larg) + "," + y1 + " " + (x + larg) + "," + (y1 + r) + " V" + y0 + " Z";
        html += '<rect x="' + (ml + i * passo) + '" y="' + mt + '" width="' + passo + '" height="' + ph + '" fill="transparent" class="alvo" data-ano="' + a + '" data-n="' + n + '"/>';
        html += '<path class="barra-ano" data-ano="' + a + '" d="' + d + '" fill="' + (a >= 2019 ? "#0f172a" : "#64748b") +
                '" style="transition-delay:' + (i * 18) + 'ms; pointer-events:none"/>';
      }
      if (a % 5 === 0 || a === 2025) html += '<text x="' + (x + larg / 2) + '" y="' + (H - mb + 20) + '" text-anchor="middle" font-size="12" fill="#64748b">' + a + "</text>";
    });
    html += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yv(0) + '" y2="' + yv(0) + '" stroke="#94a3b8"/>';
    var x19 = ml + anos.indexOf(2019) * passo;
    html += '<line x1="' + (x19 - 1) + '" x2="' + (x19 - 1) + '" y1="' + (mt - 10) + '" y2="' + yv(0) + '" stroke="#94a3b8" stroke-dasharray="4 3"/>';
    html += '<text x="' + (x19 - 8) + '" y="' + (mt - 1) + '" text-anchor="end" font-size="13" font-weight="600" fill="#0f172a">' + desde + " a partir de 2019 →</text>";
    html += '<text x="' + ml + '" y="' + (H - 6) + '" font-size="12" fill="#64748b">' + semData + " ações sem data de autuação no painel (ADI 309, 996, 1.253 e 1.544) não aparecem no gráfico.</text>";
    grafico.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Ações por ano de autuação, de 1988 a 2025, com destaque a partir de 2019">' + html + "</svg>";

    var dica = document.createElement("div"); dica.className = "dica"; grafico.appendChild(dica);
    var svg = grafico.querySelector("svg");
    function mostrarDica(alvo) {
      var ano = alvo.dataset.ano, n = alvo.dataset.n;
      var barra = svg.querySelector('.barra-ano[data-ano="' + ano + '"]');
      svg.querySelectorAll(".barra-ano").forEach(function (b) { b.style.opacity = b === barra ? 1 : 0.45; });
      var r = barra.getBoundingClientRect(), base = grafico.getBoundingClientRect();
      dica.innerHTML = "<b>" + ano + "</b><div><span>Ações autuadas</span><span>" + n + "</span></div>";
      dica.style.left = (r.left + r.width / 2 - base.left) + "px"; dica.style.top = (r.top - base.top) + "px"; dica.style.opacity = 1;
    }
    function esconder() { dica.style.opacity = 0; svg.querySelectorAll(".barra-ano").forEach(function (b) { b.style.opacity = ""; }); }
    svg.addEventListener("mouseover", function (e) { if (e.target.classList.contains("alvo")) mostrarDica(e.target); });
    svg.addEventListener("mouseleave", esconder);
  }
  function animarGrafico() {
    if (!grafico) return;
    grafico.classList.remove("pronto");
    void grafico.offsetWidth;
    requestAnimationFrame(function () { grafico.classList.add("pronto"); });
  }
  desenharGrafico();
  window.animarGrafico = animarGrafico;

  /* Impressão: tudo visível e com os valores finais */
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("[data-count]").forEach(function (el) { el._id = (el._id || 0) + 1; el.textContent = fmt(+el.dataset.count); });
    if (grafico) grafico.classList.add("pronto");
  });

  var inicio = paineis.findIndex(function (p) { return "#" + p.id === location.hash; });
  mostrar(inicio >= 0 ? inicio : 0, false);
})();
