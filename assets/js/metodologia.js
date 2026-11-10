/* Metodologia: uma tela por método, com para quê, como foi feito, resultado e referências.
   As setas do teclado percorrem os métodos, e no banco de dados também os dez passos,
   antes de sair para a próxima aba. */
(function () {
  "use strict";
  var painel = document.getElementById("metodologia");
  if (!painel) return;
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("pt-BR"); };
  var lista = function (sel, raiz) { return Array.prototype.slice.call((raiz || painel).querySelectorAll(sel)); };

  var botoesMet = lista(".met-lista [data-m]");
  var metodos = lista(".met");
  var botoesPasso = lista(".linha-passos [data-k]");
  var passos = lista(".pd");
  var comPassos = metodos.findIndex(function (m) { return m.querySelector(".linha-passos"); });
  var atual = 0, passo = 0, ultimoNumero = 0;

  function entrarAnimado(el) {
    el.classList.remove("entrou"); void el.offsetWidth; el.classList.add("entrou");
  }

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

  /* direcao < 0 abre o último passo do banco de dados, para quem volta com a seta */
  function mostrarMetodo(i, direcao) {
    atual = Math.max(0, Math.min(metodos.length - 1, i));
    metodos.forEach(function (m, k) { m.classList.toggle("ativa", k === atual); });
    botoesMet.forEach(function (b, k) {
      b.setAttribute("aria-selected", k === atual ? "true" : "false");
      b.tabIndex = k === atual ? 0 : -1;
    });
    var m = metodos[atual];
    entrarAnimado(m);
    fecharBalao();
    m.querySelectorAll(".met-res [data-count]").forEach(function (el) { contarDe(el, 0, +el.dataset.count); });
    if (atual === comPassos) mostrarPasso(direcao < 0 ? passos.length - 1 : 0, true);
  }

  botoesMet.forEach(function (b, k) { b.addEventListener("click", function () { mostrarMetodo(k, 1); }); });
  botoesPasso.forEach(function (b, k) { b.addEventListener("click", function () { mostrarPasso(k); }); });

  /* Controle usado pelas setas do teclado e pelos botões ‹ › da barra de abas */
  window.etapasPainel = window.etapasPainel || {};
  window.etapasPainel.metodologia = {
    entrar: function (direcao) {
      if (direcao < 0) mostrarMetodo(metodos.length - 1, -1); else mostrarMetodo(0, 1);
    },
    avancar: function () {
      if (atual === comPassos && passo < passos.length - 1) { mostrarPasso(passo + 1); return true; }
      if (atual < metodos.length - 1) { mostrarMetodo(atual + 1, 1); return true; }
      return false;
    },
    voltar: function () {
      if (atual === comPassos && passo > 0) { mostrarPasso(passo - 1); return true; }
      if (atual > 0) { mostrarMetodo(atual - 1, -1); return true; }
      return false;
    }
  };

  /* Balão único para notas, referências e detalhes: abre ao passar o cursor ou com o teclado,
     e fica aberto ao clicar */
  var balao = document.createElement("div");
  balao.className = "balao-nota"; balao.setAttribute("role", "tooltip"); balao.hidden = true;
  document.body.appendChild(balao);
  var fechar = null, fixo = false, dono = null;
  var refs = Array.prototype.slice.call(document.querySelectorAll("#referencias .refs p"));

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
      return d ? d.innerHTML.replace(/^<b>/, '<b class="dica-t">') : "";
    }
    return "";
  }
  function abrir(el) {
    var html = conteudo(el);
    if (!html) return;
    clearTimeout(fechar);
    dono = el;
    balao.innerHTML = html;
    balao.hidden = false;
    var r = el.getBoundingClientRect(), largura = Math.min(440, window.innerWidth - 24);
    balao.style.width = largura + "px";
    var x = Math.min(Math.max(12, r.left + r.width / 2 - largura / 2), window.innerWidth - largura - 12);
    balao.style.left = x + "px";
    balao.style.top = (r.bottom + 10 + window.scrollY) + "px";
    if (r.bottom + balao.offsetHeight + 20 > window.innerHeight && r.top > balao.offsetHeight + 20) {
      balao.style.top = (r.top + window.scrollY - balao.offsetHeight - 10) + "px";
    }
  }
  function fecharBalao() { fixo = false; dono = null; balao.hidden = true; }
  function agendarFechar() { if (fixo) return; clearTimeout(fechar); fechar = setTimeout(function () { balao.hidden = true; }, 250); }

  painel.querySelectorAll("sup.nr a, .ref, .pista").forEach(function (el) {
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

  window.addEventListener("beforeprint", function () { painel.querySelectorAll("details").forEach(function (d) { d.open = true; }); });

  /* Estado inicial */
  mostrarMetodo(0, 1);
})();
