/* Telas internas da Metodologia e dos Resultados preliminares.
   Cada aba com uma faixa de telas ganha um controle: as setas do teclado percorrem as telas,
   e na Metodologia também os dez passos do banco de dados, antes de sair para a próxima aba. */
(function () {
  "use strict";
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("pt-BR"); };
  var lista = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };
  window.etapasPainel = window.etapasPainel || {};

  function entrarAnimado(el) { el.classList.remove("entrou"); void el.offsetWidth; el.classList.add("entrou"); }
  function contarDe(el, de, ate) {
    if (reduzir || de === ate) { el.textContent = fmt(ate); return; }
    var t0 = null, dur = 750, id = (el._id = (el._id || 0) + 1);
    function quadro(t) {
      if (el._id !== id) return;
      if (!t0) t0 = t;
      var x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 3);
      el.textContent = fmt(de + (ate - de) * e);
      if (x < 1) requestAnimationFrame(quadro); else el.textContent = fmt(ate);
    }
    requestAnimationFrame(quadro);
  }

  /* Balão único para notas, referências e detalhes */
  var balao = document.createElement("div");
  balao.className = "balao-nota"; balao.setAttribute("role", "tooltip"); balao.hidden = true;
  document.body.appendChild(balao);
  var fechar = null, fixo = false, dono = null;
  var refs = lista("#referencias .refs p");
  function conteudo(el) {
    if (el.matches("sup.nr a")) {
      var li = document.querySelector(el.getAttribute("href"));
      return li ? "<b>Nota " + li.getAttribute("value") + "</b>" + li.innerHTML : "";
    }
    if (el.classList.contains("ref")) {
      var chave = el.dataset.ref;
      var p = refs.find(function (r) { return r.textContent.indexOf(chave) === 0; });
      return p ? "<b>Referência</b>" + p.innerHTML : "";
    }
    if (el.dataset.dica) {
      var d = document.getElementById(el.dataset.dica);
      return d ? d.innerHTML : "";
    }
    return "";
  }
  function abrir(el) {
    var html = conteudo(el);
    if (!html) return;
    clearTimeout(fechar);
    dono = el; balao.innerHTML = html; balao.hidden = false;
    var r = el.getBoundingClientRect(), largura = Math.min(440, window.innerWidth - 24);
    balao.style.width = largura + "px";
    balao.style.left = Math.min(Math.max(12, r.left + r.width / 2 - largura / 2), window.innerWidth - largura - 12) + "px";
    balao.style.top = (r.bottom + 10 + window.scrollY) + "px";
    if (r.bottom + balao.offsetHeight + 20 > window.innerHeight && r.top > balao.offsetHeight + 20) {
      balao.style.top = (r.top + window.scrollY - balao.offsetHeight - 10) + "px";
    }
  }
  function fecharBalao() { fixo = false; dono = null; balao.hidden = true; }
  function agendarFechar() { if (fixo) return; clearTimeout(fechar); fechar = setTimeout(function () { balao.hidden = true; }, 250); }
  lista(".painel sup.nr a, .painel .ref, .painel .pista").forEach(function (el) {
    el.addEventListener("mouseenter", function () { if (!fixo) abrir(el); });
    el.addEventListener("focus", function () { if (!fixo) abrir(el); });
    el.addEventListener("mouseleave", agendarFechar);
    el.addEventListener("blur", agendarFechar);
    el.addEventListener("click", function (e) {
      e.preventDefault();
      if (fixo && dono === el) { fecharBalao(); return; }
      fixo = true; abrir(el);
    });
    if (el.tagName === "SPAN") el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); el.click(); }
    });
  });
  balao.addEventListener("mouseenter", function () { clearTimeout(fechar); });
  balao.addEventListener("mouseleave", agendarFechar);
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".balao-nota") && !e.target.closest("sup.nr, .ref, .pista")) fecharBalao();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharBalao(); });
  window.addEventListener("resize", fecharBalao);

  /* Um controle por aba com faixa de telas */
  lista(".painel").forEach(function (painel) {
    var botoes = lista(".met-lista [data-m]", painel);
    var telas = lista(".met", painel);
    if (!telas.length) return;
    var botoesPasso = lista(".linha-passos [data-k]", painel);
    var passos = lista(".pd", painel);
    var comPassos = telas.findIndex(function (t) { return t.querySelector(".linha-passos"); });
    var atual = 0, passo = 0, ultimoNumero = 0;

    function mostrarPasso(k, forcar) {
      if (!passos.length) return;
      k = Math.max(0, Math.min(passos.length - 1, k));
      if (k === passo && !forcar) return;
      var anterior = forcar ? 0 : ultimoNumero;
      passo = k;
      passos.forEach(function (p, j) { p.classList.toggle("ativo", j === k); });
      botoesPasso.forEach(function (b, j) {
        b.classList.toggle("feito", j < k);
        b.setAttribute("aria-current", j === k ? "step" : "false");
      });
      var linha = painel.querySelector(".linha-passos");
      if (linha) linha.style.setProperty("--progresso", String(k / (passos.length - 1)));
      var p = passos[k], num = p.querySelector("[data-alvo]");
      entrarAnimado(p);
      if (num) { var alvo = +num.dataset.alvo; contarDe(num, anterior, alvo); ultimoNumero = alvo; }
    }

    function mostrarTela(i, direcao) {
      atual = Math.max(0, Math.min(telas.length - 1, i));
      telas.forEach(function (t, k) { t.classList.toggle("ativa", k === atual); });
      botoes.forEach(function (b, k) {
        b.setAttribute("aria-selected", k === atual ? "true" : "false");
        b.tabIndex = k === atual ? 0 : -1;
      });
      var t = telas[atual];
      entrarAnimado(t);
      fecharBalao();
      lista("[data-count]", t).forEach(function (el) { contarDe(el, 0, +el.dataset.count); });
      if (atual === comPassos) mostrarPasso(direcao < 0 ? passos.length - 1 : 0, true);
      if (t.querySelector("#grafico-anos") && window.animarGrafico) window.animarGrafico();
      if (t.querySelector(".fig2")) { t.querySelector(".fig2").classList.remove("pronto"); void t.offsetWidth; requestAnimationFrame(function () { t.querySelector(".fig2").classList.add("pronto"); }); }
    }

    botoes.forEach(function (b, k) { b.addEventListener("click", function () { mostrarTela(k, 1); }); });
    botoesPasso.forEach(function (b, k) { b.addEventListener("click", function () { mostrarPasso(k); }); });
    lista(".ir-tela", painel).forEach(function (b) { b.addEventListener("click", function () { mostrarTela(+b.dataset.tela, 1); }); });

    window.etapasPainel[painel.id] = {
      entrar: function (direcao) { if (direcao < 0) mostrarTela(telas.length - 1, -1); else mostrarTela(0, 1); },
      ir: function (i) { mostrarTela(i, 1); },
      avancar: function () {
        if (atual === comPassos && passo < passos.length - 1) { mostrarPasso(passo + 1); return true; }
        if (atual < telas.length - 1) { mostrarTela(atual + 1, 1); return true; }
        return false;
      },
      voltar: function () {
        if (atual === comPassos && passo > 0) { mostrarPasso(passo - 1); return true; }
        if (atual > 0) { mostrarTela(atual - 1, -1); return true; }
        return false;
      }
    };
    mostrarTela(0, 1);
  });

  /* Links de uma aba para uma tela de outra aba */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[data-tela][href^="#"]');
    if (!a) return;
    e.preventDefault();
    var id = a.getAttribute("href").slice(1), aba = document.getElementById("aba-" + id);
    if (aba) aba.click();
    var ctl = window.etapasPainel[id];
    if (ctl) ctl.ir(+a.dataset.tela);
  });

  /* Figura 2: estudos por ano e objeto normativo, a partir do Quadro 2 */
  var fonte = document.getElementById("dados-fig2"), fig = document.getElementById("fig2");
  if (fonte && fig) {
    var D = JSON.parse(fonte.textContent);
    var esc = function (t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    var dica = document.createElement("div"); dica.className = "dica"; fig.appendChild(dica);
    function mostrarDicaFig(alvo, html) {
      var r = alvo.getBoundingClientRect(), base = fig.getBoundingClientRect();
      dica.innerHTML = html;
      dica.style.left = Math.min(Math.max(r.left + r.width / 2 - base.left, 110), base.width - 110) + "px";
      dica.style.top = (r.top - base.top) + "px"; dica.style.opacity = 1;
    }
    function esconderDicaFig() { dica.style.opacity = 0; }

    /* Painel A */
    var anos = []; for (var y = 2000; y <= 2025; y++) anos.push(y);
    var W = 640, H = 226, ml = 26, mr = 6, mt = 40, mb = 22, pw = W - ml - mr, ph = H - mt - mb, vmax = 4, vtopo = 5.2;
    var passoX = pw / anos.length, larg = Math.min(16, passoX - 6);
    var xa = function (a) { return ml + (a - 2000) * passoX; };
    var yv = function (v) { return mt + ph - v / vtopo * ph; };
    var porAno = {};
    D.estudos.forEach(function (e) { (porAno[e[1]] = porAno[e[1]] || []).push(e); });
    var h = "";
    D.fases.forEach(function (f) {
      var x0 = xa(f[0]) + 1, x1 = xa(f[1] + 1) - 1;
      h += '<rect x="' + x0 + '" y="' + (mt - 34) + '" width="' + (x1 - x0) + '" height="' + (ph + 34) + '" fill="#f1f5f9" rx="6"/>';
      h += '<text x="' + ((x0 + x1) / 2) + '" y="' + (mt - 22) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">' + f[2] + '</text>';
      h += '<text x="' + ((x0 + x1) / 2) + '" y="' + (mt - 10) + '" text-anchor="middle" font-size="9.5" fill="#64748b">' + f[3] + '</text>';
    });
    var g0 = xa(D.lacuna[0]), g1 = xa(D.lacuna[1] + 1);
    var partes = D.lacuna[2].split(" (");
    h += '<text x="' + ((g0 + g1) / 2) + '" y="' + yv(2.3) + '" text-anchor="middle" font-size="10" font-style="italic" fill="#64748b">' + partes[0] + '</text>';
    h += '<text x="' + ((g0 + g1) / 2) + '" y="' + (yv(2.3) + 12) + '" text-anchor="middle" font-size="10" font-style="italic" fill="#64748b">(' + partes[1] + '</text>';
    h += '<line x1="' + (g0 + 8) + '" x2="' + (g1 - 8) + '" y1="' + yv(1.2) + '" y2="' + yv(1.2) + '" stroke="#94a3b8" stroke-dasharray="3 3"/>';
    for (var v = 0; v <= vmax; v++) {
      h += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yv(v) + '" y2="' + yv(v) + '" stroke="#e2e8f0"/>';
      h += '<text x="' + (ml - 6) + '" y="' + (yv(v) + 4) + '" text-anchor="end" font-size="10" fill="#94a3b8">' + v + "</text>";
    }
    anos.forEach(function (a, i) {
      var lista = porAno[a] || [], x = xa(a) + (passoX - larg) / 2;
      var mp = lista.filter(function (e) { return e[3] === "mp"; }).length, dec = lista.length - mp;
      if (lista.length) {
        var base = yv(0);
        if (mp) { h += '<rect class="barra-fig" x="' + x + '" y="' + yv(mp) + '" width="' + larg + '" height="' + (base - yv(mp)) + '" rx="3" fill="#94a3b8" style="transition-delay:' + (i * 20) + 'ms"/>'; base = yv(mp); }
        if (dec) h += '<rect class="barra-fig" x="' + x + '" y="' + yv(mp + dec) + '" width="' + larg + '" height="' + (base - yv(mp + dec)) + '" rx="3" fill="#d97706" style="transition-delay:' + (i * 20) + 'ms"/>';
        h += '<text x="' + (x + larg / 2) + '" y="' + (yv(lista.length) - 4) + '" text-anchor="middle" font-size="10.5" font-weight="600" fill="#334155">' + lista.length + "</text>";
        h += '<rect class="alvo-fig" data-ano="' + a + '" x="' + xa(a) + '" y="' + mt + '" width="' + passoX + '" height="' + ph + '" fill="transparent"/>';
      }
      if (a % 5 === 0 || a === 2025) h += '<text x="' + (x + larg / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10.5" fill="#64748b">' + a + "</text>";
    });
    h += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yv(0) + '" y2="' + yv(0) + '" stroke="#94a3b8"/>';
    D.marcos.forEach(function (m) {
      var cx = xa(m[1]) + passoX / 2, cy = yv(4.85);
      h += '<g class="marco" data-marco="' + m[0] + '" tabindex="0"><circle cx="' + cx + '" cy="' + cy + '" r="8" fill="#fff" stroke="#334155"/><text x="' + cx + '" y="' + (cy + 3.5) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#0f172a">' + m[0] + "</text></g>";
    });
    var a = fig.querySelector(".fig2-a");
    a.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Estudos incluídos por ano de publicação, de 2000 a 2025, com as três fases e os marcos institucionais">' + h + "</svg>" +
      '<p class="fig-leg"><span class="lg-mp">Medida provisória</span><span class="lg-dec">Decreto presidencial</span><span class="lg-marco">Marcos institucionais</span></p>';
    var svgA = a.querySelector("svg");
    svgA.addEventListener("mouseover", function (e) {
      var alvo = e.target.closest(".alvo-fig, .marco");
      if (!alvo) return;
      if (alvo.classList.contains("marco")) {
        var m = D.marcos.find(function (x) { return String(x[0]) === alvo.dataset.marco; });
        mostrarDicaFig(alvo, "<b>Marco " + m[0] + " · " + m[1] + "</b><div><span>" + esc(m[2]) + "</span></div>");
      } else {
        var ano = +alvo.dataset.ano;
        mostrarDicaFig(alvo, "<b>" + ano + "</b>" + porAno[ano].map(function (e) { return '<div class="dica-est ' + e[3] + '"><span>' + esc(e[0]) + "</span><span>" + esc(e[2]) + "</span></div>"; }).join(""));
      }
    });
    svgA.addEventListener("mouseleave", esconderDicaFig);

    /* Painel B */
    var WB = 640, HB = 104, mlB = 150, nmax = 20, pwB = WB - mlB - 60;
    var xb = function (n) { return mlB + n / nmax * pwB; };
    var cores = ["#0f172a", "#64748b", "#cbd5e1"], tinta = ["#fff", "#fff", "#334155"];
    var hb = "";
    for (var n = 0; n <= nmax; n += 4) {
      hb += '<line x1="' + xb(n) + '" x2="' + xb(n) + '" y1="6" y2="' + (HB - 22) + '" stroke="#e2e8f0"/>';
      hb += '<text x="' + xb(n) + '" y="' + (HB - 8) + '" text-anchor="middle" font-size="10" fill="#94a3b8">' + n + "</text>";
    }
    D.objeto.forEach(function (o, k) {
      var y = 8 + k * 40, acc = 0;
      var rot = o[0].length > 20 ? o[0].replace(" em sentido estrito", "") : o[0];
      hb += '<text x="' + (mlB - 10) + '" y="' + (y + 17) + '" text-anchor="end" font-size="11.5" font-weight="600" fill="#0f172a">' + rot + "</text>";
      if (k === 1) hb += '<text x="' + (mlB - 10) + '" y="' + (y + 31) + '" text-anchor="end" font-size="10" fill="#64748b">em sentido estrito</text>';
      o[2].forEach(function (q, c) {
        if (!q) return;
        hb += '<rect class="seg-b" data-c="' + c + '" data-q="' + q + '" data-o="' + k + '" x="' + (xb(acc) + 1) + '" y="' + y + '" width="' + (xb(acc + q) - xb(acc) - 2) + '" height="26" rx="4" fill="' + cores[c] + '"/>';
        hb += '<text x="' + ((xb(acc) + xb(acc + q)) / 2) + '" y="' + (y + 17) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + tinta[c] + '" pointer-events="none">' + q + "</text>";
        acc += q;
      });
      hb += '<text x="' + (xb(acc) + 8) + '" y="' + (y + 17) + '" font-size="11" fill="#475569">n = ' + o[1] + "</text>";
      if (k === 1) {
        var xr = xb(acc) + 60;
        hb += '<text x="' + xr + '" y="' + (y + 6) + '" font-size="10.5" font-weight="700" fill="#334155">' + D.razao[0] + "</text>";
        hb += '<text x="' + xr + '" y="' + (y + 19) + '" font-size="10.5" fill="#475569">' + D.razao[1] + "</text>";
        hb += '<text x="' + xr + '" y="' + (y + 32) + '" font-size="10.5" fill="#475569">' + D.razao[2] + "</text>";
      }
    });
    var b = fig.querySelector(".fig2-b");
    b.innerHTML = '<svg viewBox="0 0 ' + WB + " " + HB + '" role="img" aria-label="Medida provisória, 19 estudos, 9 com análise substantiva das decisões, 5 com menção periférica e 5 sem decisão identificada. Decreto presidencial, 2 estudos, ambos com análise substantiva">' + hb + "</svg>" +
      '<p class="fig-leg">' + D.centralidade.map(function (c, k) { return '<span style="--leg:' + cores[k] + '">' + c + "</span>"; }).join("") + "</p>" +
      "";
    var svgB = b.querySelector("svg");
    svgB.addEventListener("mouseover", function (e) {
      var s = e.target.closest(".seg-b"); if (!s) return;
      mostrarDicaFig(s, "<b>" + D.objeto[+s.dataset.o][0] + "</b><div><span>" + D.centralidade[+s.dataset.c] + "</span><span>" + s.dataset.q + "</span></div>");
    });
    svgB.addEventListener("mouseleave", esconderDicaFig);

    /* As discrepâncias realçam o painel correspondente */
    lista(".discrepancias [data-alvo]").forEach(function (li) {
      function ligar() { fig.dataset.realce = li.dataset.alvo; }
      function desligar() { delete fig.dataset.realce; }
      li.addEventListener("mouseenter", ligar); li.addEventListener("mouseleave", desligar);
      li.tabIndex = 0; li.addEventListener("focus", ligar); li.addEventListener("blur", desligar);
    });
  }

  window.addEventListener("beforeprint", function () {
    lista(".painel details").forEach(function (d) { d.open = true; });
    lista(".fig2").forEach(function (f) { f.classList.add("pronto"); });
  });
})();
