/* Metodologia em quatro telas internas: visão geral, passo a passo, regras e falhas, técnicas.
   As setas do teclado percorrem as telas e os passos antes de sair para a próxima aba. */
(function () {
  "use strict";
  var painel = document.getElementById("metodologia");
  if (!painel) return;
  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fmt = function (n) { return Math.round(n).toLocaleString("pt-BR"); };

  var botoesSub = Array.prototype.slice.call(painel.querySelectorAll(".sub-abas [data-sub]"));
  var telas = Array.prototype.slice.call(painel.querySelectorAll(".sub-tela"));
  var botoesPasso = Array.prototype.slice.call(painel.querySelectorAll(".linha-passos [data-k]"));
  var passos = Array.prototype.slice.call(painel.querySelectorAll(".pd"));
  var botoesFicha = Array.prototype.slice.call(painel.querySelectorAll(".fichas [data-f]"));
  var fichas = Array.prototype.slice.call(painel.querySelectorAll(".fd"));
  var botoesTec = Array.prototype.slice.call(painel.querySelectorAll(".tec-lista [data-t]"));
  var tecnicas = Array.prototype.slice.call(painel.querySelectorAll(".td"));
  var faixa = Array.prototype.slice.call(painel.querySelectorAll(".faixa-estagios .fe"));
  var sub = 0, passo = 0, ultimoNumero = 0;

  function entrarAnimado(el) {
    el.classList.remove("entrou"); void el.offsetWidth; el.classList.add("entrou");
  }

  function contarDe(el, de, ate) {
    if (reduzir || de === ate) { el.textContent = fmt(ate); return; }
    var t0 = null, dur = 700, id = (el._id = (el._id || 0) + 1);
    function quadro(t) {
      if (el._id !== id) return;
      if (!t0) t0 = t;
      var x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 3);
      el.textContent = fmt(de + (ate - de) * e);
      if (x < 1) requestAnimationFrame(quadro); else el.textContent = fmt(ate);
    }
    requestAnimationFrame(quadro);
  }

  function mostrarSub(i) {
    sub = Math.max(0, Math.min(telas.length - 1, i));
    telas.forEach(function (t, k) { t.classList.toggle("ativa", k === sub); });
    botoesSub.forEach(function (b, k) { b.setAttribute("aria-selected", k === sub ? "true" : "false"); });
    entrarAnimado(telas[sub]);
    if (sub === 0) telas[0].querySelectorAll("[data-count]").forEach(function (el) { contarDe(el, 0, +el.dataset.count); });
    if (sub === 1) mostrarPasso(passo, true);
  }

  function mostrarPasso(k, forcar) {
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

  function mostrarFicha(i) {
    fichas.forEach(function (f, k) { f.classList.toggle("ativa", k === i); });
    botoesFicha.forEach(function (b, k) { b.setAttribute("aria-selected", k === i ? "true" : "false"); });
    entrarAnimado(fichas[i]);
  }

  function mostrarTecnica(i) {
    tecnicas.forEach(function (t, k) { t.classList.toggle("ativa", k === i); });
    botoesTec.forEach(function (b, k) { b.setAttribute("aria-selected", k === i ? "true" : "false"); });
    entrarAnimado(tecnicas[i]);
    var est = tecnicas[i].dataset.estagio || "";
    faixa.forEach(function (f) { f.classList.toggle("acesa", est.indexOf(f.dataset.e) >= 0); });
  }

  botoesSub.forEach(function (b, k) { b.addEventListener("click", function () { if (k === 1) passo = 0; mostrarSub(k); }); });
  botoesPasso.forEach(function (b, k) { b.addEventListener("click", function () { mostrarPasso(k); }); });
  botoesFicha.forEach(function (b, k) { b.addEventListener("click", function () { mostrarFicha(k); }); });
  botoesTec.forEach(function (b, k) { b.addEventListener("click", function () { mostrarTecnica(k); }); });

  /* Controle usado pelas setas do teclado e pelos botões ‹ › da barra de abas */
  window.etapasPainel = window.etapasPainel || {};
  window.etapasPainel.metodologia = {
    entrar: function (direcao) {
      if (direcao < 0) { passo = passos.length - 1; mostrarSub(telas.length - 1); }
      else { passo = 0; mostrarSub(0); }
    },
    avancar: function () {
      if (sub === 1 && passo < passos.length - 1) { mostrarPasso(passo + 1); return true; }
      if (sub < telas.length - 1) { if (sub + 1 === 1) passo = 0; mostrarSub(sub + 1); return true; }
      return false;
    },
    voltar: function () {
      if (sub === 1 && passo > 0) { mostrarPasso(passo - 1); return true; }
      if (sub > 0) { if (sub - 1 === 1) passo = passos.length - 1; mostrarSub(sub - 1); return true; }
      return false;
    }
  };

  /* Notas em balão: abre ao passar o cursor ou com o teclado, e fica aberta ao clicar */
  var balao = document.createElement("div");
  balao.className = "balao-nota"; balao.setAttribute("role", "tooltip"); balao.hidden = true;
  document.body.appendChild(balao);
  var fechar = null, fixo = false;
  function abrirNota(a) {
    var li = document.querySelector(a.getAttribute("href"));
    if (!li) return;
    clearTimeout(fechar);
    balao.innerHTML = "<b>Nota " + li.getAttribute("value") + "</b>" + li.innerHTML;
    balao.hidden = false;
    var r = a.getBoundingClientRect(), largura = Math.min(420, window.innerWidth - 24);
    balao.style.width = largura + "px";
    var x = Math.min(Math.max(12, r.left + r.width / 2 - largura / 2), window.innerWidth - largura - 12);
    var y = r.bottom + 10 + window.scrollY;
    balao.style.left = x + "px"; balao.style.top = y + "px";
    if (r.bottom + balao.offsetHeight + 20 > window.innerHeight) balao.style.top = (r.top + window.scrollY - balao.offsetHeight - 10) + "px";
  }
  function agendarFechar() { if (fixo) return; clearTimeout(fechar); fechar = setTimeout(function () { balao.hidden = true; }, 250); }
  painel.querySelectorAll("sup.nr a").forEach(function (a) {
    a.addEventListener("mouseenter", function () { abrirNota(a); });
    a.addEventListener("focus", function () { abrirNota(a); });
    a.addEventListener("mouseleave", agendarFechar);
    a.addEventListener("blur", agendarFechar);
    a.addEventListener("click", function (e) { e.preventDefault(); fixo = !fixo || balao.hidden; abrirNota(a); });
  });
  balao.addEventListener("mouseenter", function () { clearTimeout(fechar); });
  balao.addEventListener("mouseleave", agendarFechar);
  document.addEventListener("click", function (e) { if (!e.target.closest(".balao-nota") && !e.target.closest("sup.nr")) { fixo = false; balao.hidden = true; } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { fixo = false; balao.hidden = true; } });

  window.addEventListener("beforeprint", function () { painel.querySelectorAll("details").forEach(function (d) { d.open = true; }); });

  /* Estado inicial */
  mostrarFicha(0);
  mostrarTecnica(0);
  mostrarSub(0);
})();
