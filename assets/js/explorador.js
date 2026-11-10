(function () {
  "use strict";
  var DADOS = (window.ACOES || []).slice();
  var $ = function (id) { return document.getElementById(id); };
  var q = $("q"), fClasse = $("classe"), fOrigem = $("origem"), fDecidida = $("decidida"), fTram = $("tramitacao");
  var corpo = $("corpo"), contagem = $("contagem");
  var ordem = { k: "numero", dir: 1, classeFirst: true };
  var aberta = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function semAcento(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function dataBR(iso) { return iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : ""; }
  function tag(v) {
    if (v === "Sim") return '<span class="tag sim">Sim</span>';
    if (v === "Não") return '<span class="tag nao">Não</span>';
    return esc(v);
  }

  // opções de origem a partir dos dados
  Array.from(new Set(DADOS.map(function (a) { return a.origem; }))).sort().forEach(function (o) {
    var op = document.createElement("option"); op.textContent = o; fOrigem.appendChild(op);
  });

  // índice de busca
  DADOS.forEach(function (a) {
    a._busca = semAcento([a.acao, a.acao.replace(" ", ""), a.ato, a.decreto, a.proponente, a.relator].join(" "));
  });

  function filtrar() {
    var termos = semAcento(q.value).split(/\s+/).filter(Boolean);
    return DADOS.filter(function (a) {
      if (fClasse.value && a.classe !== fClasse.value) return false;
      if (fOrigem.value && a.origem !== fOrigem.value) return false;
      if (fDecidida.value && a.decidida !== fDecidida.value) return false;
      if (fTram.value && a.tramitacao !== fTram.value) return false;
      for (var i = 0; i < termos.length; i++) if (a._busca.indexOf(termos[i]) < 0) return false;
      return true;
    });
  }

  function comparar(a, b) {
    var k = ordem.k, va, vb;
    if (k === "numero") {
      va = a.classe + String(a.numero).padStart(6, "0"); vb = b.classe + String(b.numero).padStart(6, "0");
    } else { va = a[k] || ""; vb = b[k] || ""; }
    if (va === vb) return 0;
    if (va === "") return 1;           // vazios sempre no fim
    if (vb === "") return -1;
    return (va < vb ? -1 : 1) * ordem.dir;
  }

  function detalhe(a) {
    var campos = [
      ["Origem", a.origem], ["Via de identificação", a.via], ["Justificativa de inclusão", a.justificativa],
      ["Decreto principal", a.decreto], ["Data de autuação", a.autuacao ? dataBR(a.autuacao) : a.autuacao_obs],
      ["Em tramitação? (25/10/2026)", a.tramitacao], ["Última decisão final no arquivo 05", a.ultima_decisao],
      ["Amici curiae no arquivo 08 (n)", a.amici]
    ];
    return '<tr class="detalhe"><td colspan="8"><dl>' + campos.map(function (c) {
      return "<dt>" + esc(c[0]) + "</dt><dd>" + esc(c[1]) + "</dd>";
    }).join("") + "</dl></td></tr>";
  }

  function render() {
    var lista = filtrar().sort(comparar);
    contagem.innerHTML = "<b>" + lista.length + "</b> de " + DADOS.length + " ações";
    if (!lista.length) { corpo.innerHTML = '<tr><td colspan="8" class="vazio">Nenhuma ação com esses filtros.</td></tr>'; return; }
    corpo.innerHTML = lista.map(function (a) {
      var linha = '<tr class="linha' + (aberta === a.acao ? " aberta" : "") + '" data-acao="' + esc(a.acao) + '" tabindex="0" aria-expanded="' + (aberta === a.acao) + '">' +
        '<td class="acao">' + esc(a.acao) + "</td>" +
        '<td class="ato">' + esc(a.ato) + "</td>" +
        '<td class="prop">' + esc(a.proponente) + "</td>" +
        '<td class="data">' + (a.autuacao ? dataBR(a.autuacao) : "—") + "</td>" +
        "<td>" + esc(a.relator) + "</td>" +
        "<td>" + esc(a.situacao) + "</td>" +
        "<td>" + tag(a.decidida) + "</td>" +
        '<td><a href="' + esc(a.link) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">Abrir</a></td></tr>';
      return linha + (aberta === a.acao ? detalhe(a) : "");
    }).join("");
  }

  corpo.addEventListener("click", function (e) {
    var tr = e.target.closest("tr.linha"); if (!tr) return;
    aberta = aberta === tr.dataset.acao ? null : tr.dataset.acao; render();
  });
  corpo.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr.linha")) {
      e.preventDefault(); aberta = aberta === e.target.dataset.acao ? null : e.target.dataset.acao; render();
      var el = corpo.querySelector('tr.linha[data-acao="' + CSS.escape(e.target.dataset.acao) + '"]'); if (el) el.focus();
    }
  });
  document.querySelectorAll("thead th[data-k]").forEach(function (th) {
    th.addEventListener("click", function () {
      var k = th.dataset.k;
      ordem.dir = ordem.k === k ? -ordem.dir : 1; ordem.k = k;
      document.querySelectorAll("thead th").forEach(function (o) { o.removeAttribute("aria-sort"); });
      th.setAttribute("aria-sort", ordem.dir === 1 ? "ascending" : "descending");
      render();
    });
  });
  [q, fClasse, fOrigem, fDecidida, fTram].forEach(function (el) { el.addEventListener("input", function () { aberta = null; render(); }); });
  $("limpar").addEventListener("click", function () {
    q.value = ""; fClasse.value = ""; fOrigem.value = ""; fDecidida.value = ""; fTram.value = ""; aberta = null; render(); q.focus();
  });

  document.querySelector('thead th[data-k="numero"]').setAttribute("aria-sort", "ascending");
  render();
})();
