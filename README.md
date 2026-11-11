# O que o Supremo fez com os decretos do Presidente?

**Condições para o julgamento de mérito no controle concentrado de constitucionalidade (1988–2025)**

Apresentação do Exame de Qualificação de Fernando Lima Nogueira da Silva, Mestrado Acadêmico em Direito do Programa de Pós-Graduação em Direito da Universidade Federal Rural do Semi-Árido. Orientador: Ulisses Levy Silvério dos Reis, Prof. Dr.

- **Apresentação:** https://fernandolimans.github.io/qualificacao-decretos-stf/
- **Apresentação em PDF:** [`apresentacao.pdf`](apresentacao.pdf)
- **Material disponibilizado para replicação:** https://osf.io/8krpv/

## Como apresentar

A página segue o formato de painel: a capa fica no alto, e as seis seções ficam em abas logo abaixo (Problema, Pergunta e hipótese, Objetivos, Metodologia, Resultados preliminares e Referências). Troque de seção clicando nas abas, nas setas ‹ e › da barra ou nas teclas ← e → do teclado. Nas abas Metodologia e Resultados preliminares, as teclas ← e → percorrem antes as telas internas, e no método do banco de dados também os dez passos, e só depois passam à aba seguinte. Cada citação no texto, sublinhada com pontilhado, abre a referência completa quando se passa o cursor sobre ela ou se clica nela, e o mesmo vale para os números das notas. A tecla `F` ou o botão "Tela cheia" põe a página em tela cheia. A página funciona também sem internet, abrindo `index.html` direto do computador, porque as fontes, os ícones e os dados estão neste repositório.

## O que há aqui

| Caminho | Conteúdo |
|---|---|
| `index.html` | A apresentação, com a capa e seis seções em abas |
| `dados/acoes.csv`, `dados/acoes.json`, `dados/acoes.js` | Dados das 242 ações, extraídos da aba UNIVERSO_FINAL da planilha das ações, usados nos links de cada ação ao portal do STF |
| `dados/resumo.json` | Contagens extraídas das planilhas |
| `img/ajuizamentos_por_ano.svg` | Versão estática do gráfico preliminar das ações por ano de autuação |
| `scripts/gerar_dados.py` | Gera os arquivos de `dados/` e `img/` a partir das planilhas |

## Como gerar os dados de novo

As planilhas estão em https://osf.io/8krpv/.

```bash
pip install openpyxl
python scripts/gerar_dados.py "Ações de Controle de Constitucionalidade - qualificação.xlsx" "Prisma 2020 - qualificação.xlsx"
```

## Créditos de terceiros

Fonte Inter (SIL Open Font License, em `assets/fonts/`). Ícones Lucide (licença ISC, em `assets/LICENSE-lucide.txt`).
