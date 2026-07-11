# Fase 6 — Integração e2e + multi-aeronave

## O que está provado (e2e do loop de nota)

Script: `backend/scripts/e2e-scoring.mjs` — rodar com `npm run e2e:scoring`
(dentro de `backend/`, com o backend no ar em `:3000`).

É um smoke-test auto-contido: cria dados de teste via Prisma, exercita o loop
inteiro por HTTP e **apaga tudo no fim** (deixa o DB como estava). Cobre:

1. **Login + bundle publicado** — `POST /auth/login` → `GET /procedures/published?aircraftModelCode=A320`.
   É exatamente o que o app desktop consome. Confirma que a config feita pela
   site chega ao consumidor.
2. **Ingestão + nota** — `POST /flight/:id/events` (o caminho de ingestão do
   desktop) → `PATCH /flight/review/:id`. Assere
   `score = clamp(base + Σ(count × peso))` e os 4 contadores por severidade.
   Ex.: 2 Std + 3 Dev + 1 Cmp com pesos `0 / +1 / −5 / −15` → **70**.
3. **Config muda a nota SEM deploy** — anexa uma `ProcedureVersion` com pesos
   diferentes (`dev −10`, `cmp −20`) ao mesmo voo e re-revisa: os **mesmos
   eventos** passam a valer **50**. É a prova central de "verificação
   configurável pela site, sem redeploy e sem mudar código".
4. **Voo sem eventos** — `score = baseScore` (100), sem `NaN` (o bug do
   `finishExam` que foi evitado de propósito).

Resultado atual: **11/11 checks verdes**, dados de teste limpos.

### Como a nota resolve os pesos

`FlightRepository.getScoringConfigForFlight(flightId)`:
`flight.procedureVersion` (quando setado) → senão a `ProcedureVersion`
**PUBLISHED** do modelo da aeronave do voo → senão defaults. Ou seja, o voo nem
precisa apontar explicitamente para a versão: basta a aeronave ter um modelo com
versão publicada.

## Multi-aeronave — decisão e estado

**Decisão (2026-07-10): adiar o 2º modelo; focar o e2e no A320.**

O motor de regras (`desktop/src/rules/*`) **já é genérico por aeronave**:
consome `aircraftModelCode` + aliases do `DatarefCatalog` + `expr`, sem nada
hard-coded de Airbus. Um B738 com os mesmos aliases (`groundspeed_kt`,
`onground_any`, …) roda no mesmo engine sem tocar em código.

O que **não** é genérico ainda é a **detecção de fase**
(`desktop/src/phase/phase-fsm.ts`): é a FSM do ToLiss/Airbus, lendo
`AirbusFBW/QPACFlightPhase`, `APPhase`, masters e mode selector. Para um Boeing
esses datarefs não existem.

### Caminho recomendado quando formos ao 2º modelo

Duas opções (na próxima fase, não agora):

- **Provider de fase por `aircraftModelCode`** — registrar uma FSM Boeing ao
  lado da Airbus e o pipeline escolhe pela sigla. Incremental, testável com
  fixtures/replay, não mexe no que funciona para o A320.
- **Regras de fase data-driven no bundle** — fases definidas por `expr` sobre
  aliases, 100% configurável pela site. Mais alinhado à filosofia do projeto,
  porém exige estender o schema do bundle publicado (+ migração) e uma engine de
  fase que interprete essas expressões. É o "norte" de longo prazo.

Recomendação: começar pelo **provider por modelo** (barato, seguro) e migrar
para **fases data-driven** só se surgir um 3º/4º modelo — aí o custo do schema
se paga.
