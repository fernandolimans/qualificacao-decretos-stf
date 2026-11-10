"""Gera os dados e o gráfico do site a partir das planilhas da qualificação.

Uso:
    python scripts/gerar_dados.py "Ações de Controle de Constitucionalidade - qualificação.xlsx" "Prisma 2020 - qualificação.xlsx"

As planilhas estão publicadas no Open Science Framework (https://osf.io/8krpv/).
Saídas: dados/acoes.json, dados/acoes.csv, dados/resumo.json e img/ajuizamentos_por_ano.svg.
"""
import csv
import datetime as dt
import json
import re
import sys
from collections import Counter
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parent.parent
TEAL, AMBAR = "#00897b", "#c8711a"          # cores dos dados (validadas para daltonismo)
TINTA, TINTA2, GRADE = "#1d2a36", "#5b6670", "#e4e1da"
CORTE_ANO = 2019


def texto(v):
    return "" if v is None else str(v).strip()


def acoes(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True)["UNIVERSO_FINAL"]
    cab = [texto(c.value) for c in ws[4]]
    col = lambda inicio: next(i for i, h in enumerate(cab) if h.startswith(inicio))
    C = {k: col(v) for k, v in {
        "acao": "Ação", "origem": "Origem", "via": "Via de identificação",
        "ato": "Ato(s) indicado(s)", "justificativa": "Justificativa de inclusão",
        "link": "Link no Portal STF", "relator": "Relator atual", "autuacao": "Data de autuação",
        "tramitacao": "Em tramitação?", "situacao": "Situação processual",
        "proponente": "Polo ativo", "ultima_decisao": "Última decisão final",
        "amici": "Amici curiae", "decreto": "Decreto principal", "decidida": "Decidida até 30/06/2026"}.items()}
    saida = []
    for r in ws.iter_rows(min_row=5, values_only=True):
        if not r[C["acao"]]:
            continue
        acao = texto(r[C["acao"]])
        classe, numero = acao.split()[0], int(re.sub(r"\D", "", acao.split()[1]))
        aut = r[C["autuacao"]]
        data = aut.date().isoformat() if isinstance(aut, dt.datetime) else ""
        saida.append({
            "acao": acao, "classe": classe, "numero": numero,
            "origem": texto(r[C["origem"]]), "via": texto(r[C["via"]]),
            "ato": texto(r[C["ato"]]), "decreto": texto(r[C["decreto"]]),
            "proponente": texto(r[C["proponente"]]), "relator": texto(r[C["relator"]]),
            "autuacao": data, "ano": int(data[:4]) if data else None,
            "autuacao_obs": "" if data else texto(aut),
            "situacao": texto(r[C["situacao"]]), "tramitacao": texto(r[C["tramitacao"]]),
            "decidida": texto(r[C["decidida"]]), "ultima_decisao": texto(r[C["ultima_decisao"]]),
            "amici": r[C["amici"]] or 0, "justificativa": texto(r[C["justificativa"]]),
            "link": texto(r[C["link"]]),
        })
    assert len(saida) == 242 and len({a["acao"] for a in saida}) == 242
    return saida


def prisma(caminho):
    ws = openpyxl.load_workbook(caminho, data_only=True)["FLUXOGRAMA_PRISMA"]
    linhas = [(texto(r[1]), r[2]) for r in ws.iter_rows(min_row=3, values_only=True) if r[2] is not None]
    pega = lambda inicio: next(int(n) for item, n in linhas if item.startswith(inicio))
    return {
        "identificados": pega("Registros identificados nas 5 bases"),
        "duplicados": -pega("(−) Duplicados"), "nao_extraidos_redalyc": -pega("(−) Não extraídos do Redalyc"),
        "triados": pega("Registros triados"), "excluidos_triagem": -pega("(−) Excluídos na triagem"),
        "texto_completo": pega("Textos completos avaliados"), "excluidos_elegibilidade": -pega("(−) Excluídos com razões"),
        "incluidos_bases": pega("Incluídos das 5 bases"), "suplementares_identificados": pega("Registros identificados nas buscas suplementares"),
        "incluidos_heinonline": pega("Incluídos da HeinOnline"), "incluidos_teses": pega("Incluídos do Catálogo CAPES"),
        "incluidos_total": pega("Total de estudos incluídos"), "sobre_mp": 19, "sobre_decreto": 2,
    }


def svg_por_ano(contagem, sem_data):
    anos = list(range(1988, 2026))
    W, H, ml, mr, mt, mb = 760, 380, 36, 10, 30, 46
    pw, ph = W - ml - mr, H - mt - mb
    vmax = (max(contagem.values()) + 4) // 5 * 5
    passo = pw / len(anos)
    barra = min(14, passo - 3)
    y = lambda v: mt + ph - v / vmax * ph
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
         f'aria-labelledby="t d" font-family="Inter, system-ui, sans-serif">',
         '<title id="t">Ações de controle concentrado contra decretos presidenciais, por ano de autuação</title>',
         f'<desc id="d">Barras por ano de 1988 a 2025. A partir de {CORTE_ANO} as barras estão destacadas.</desc>']
    for v in range(0, vmax + 1, 5):
        p.append(f'<line x1="{ml}" x2="{W-mr}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="{GRADE}" stroke-width="1"/>')
        p.append(f'<text x="{ml-8}" y="{y(v)+4:.1f}" text-anchor="end" font-size="14" fill="{TINTA2}">{v}</text>')
    for i, a in enumerate(anos):
        v = contagem.get(a, 0)
        x = ml + i * passo + (passo - barra) / 2
        cor = AMBAR if a >= CORTE_ANO else TEAL
        if v:
            h = y(0) - y(v)
            r = min(4, h / 2)
            # topo arredondado (4px), base reta
            p.append(f'<path d="M{x:.1f},{y(0):.1f} V{y(v)+r:.1f} Q{x:.1f},{y(v):.1f} {x+r:.1f},{y(v):.1f} '
                     f'H{x+barra-r:.1f} Q{x+barra:.1f},{y(v):.1f} {x+barra:.1f},{y(v)+r:.1f} V{y(0):.1f} Z" fill="{cor}">'
                     f'<title>{a}: {v} ação{"ões" if v != 1 else ""}</title></path>')
        if a % 5 == 0 or a == 2025:
            p.append(f'<text x="{x+barra/2:.1f}" y="{H-mb+20}" text-anchor="middle" font-size="14" fill="{TINTA2}">{a}</text>')
    p.append(f'<line x1="{ml}" x2="{W-mr}" y1="{y(0):.1f}" y2="{y(0):.1f}" stroke="{TINTA2}" stroke-width="1"/>')
    # rótulos seletivos: o pico e o recorte desde 2019
    pico = max(contagem, key=contagem.get)
    xp = ml + anos.index(pico) * passo + passo / 2
    p.append(f'<text x="{xp:.1f}" y="{y(contagem[pico])-8:.1f}" text-anchor="middle" font-size="14" font-weight="600" fill="{TINTA}">{contagem[pico]}</text>')
    x19 = ml + anos.index(CORTE_ANO) * passo
    p.append(f'<line x1="{x19-2:.1f}" x2="{x19-2:.1f}" y1="{mt-6}" y2="{y(0):.1f}" stroke="{TINTA2}" stroke-width="1"/>')
    desde = sum(v for a, v in contagem.items() if a >= CORTE_ANO)
    p.append(f'<text x="{x19-10:.1f}" y="{mt+4}" text-anchor="end" font-size="14" font-weight="600" fill="{TINTA}">{desde} ações desde {CORTE_ANO} →</text>')
    p.append(f'<text x="{ml}" y="{H-6}" font-size="12.5" fill="{TINTA2}">{sem_data} ações sem data de autuação no painel '
             f'(ADI 309, 996, 1.253 e 1.544) não aparecem no gráfico.</text>')
    p.append("</svg>")
    return "\n".join(p)


def main(xlsx_acoes, xlsx_prisma):
    lista = acoes(xlsx_acoes)
    (RAIZ / "dados").mkdir(exist_ok=True)
    (RAIZ / "img").mkdir(exist_ok=True)
    json.dump(lista, open(RAIZ / "dados/acoes.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # cópia em JavaScript para o explorador abrir também sem servidor (arquivo local)
    (RAIZ / "dados/acoes.js").write_text("window.ACOES = " + json.dumps(lista, ensure_ascii=False) + ";\n", encoding="utf-8")
    with open(RAIZ / "dados/acoes.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(lista[0]), delimiter=";")
        w.writeheader(); w.writerows(lista)
    por_ano = Counter(a["ano"] for a in lista if a["ano"])
    sem_data = sum(1 for a in lista if not a["ano"])
    resumo = {
        "total": len(lista), "por_classe": dict(Counter(a["classe"] for a in lista)),
        "por_origem": dict(Counter(a["origem"] for a in lista)),
        "desde_2019": sum(v for k, v in por_ano.items() if k >= CORTE_ANO),
        "decididas_ate_30_06_2026": sum(1 for a in lista if a["decidida"] == "Sim"),
        "em_tramitacao_25_10_2026": dict(Counter(a["tramitacao"] for a in lista)),
        "por_ano": {str(k): por_ano[k] for k in sorted(por_ano)}, "sem_data_autuacao": sem_data,
        "prisma": prisma(xlsx_prisma),
    }
    json.dump(resumo, open(RAIZ / "dados/resumo.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    (RAIZ / "img/ajuizamentos_por_ano.svg").write_text(svg_por_ano(por_ano, sem_data), encoding="utf-8")
    print(json.dumps({k: v for k, v in resumo.items() if k != "por_ano"}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
