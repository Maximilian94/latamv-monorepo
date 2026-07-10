# Plano: App Desktop de Monitoramento e Validação de Voo (X-Plane)

## Context

O objetivo é construir um **app desktop** que conecta ao **X-Plane Web API** (HTTP + WebSocket em `localhost:8086`), monitora os parâmetros de voo em tempo real e **valida o voo por fases**, gerando "eventos" de conformidade/desvio que alimentam o sistema de pontuação que **já existe** no backend.

Descoberta-chave da investigação: o backend **já modela** todo o domínio de validação:
- `Flight` já tem `OUT/OFF/ON/IN` (timestamps ACARS), `score` e contadores `amountOf{ProactiveExcellence,StandardCompliance,ProceduralDeviation,SafetyCompromise}` (modelo TEM/LOSA).
- `FlightEvent { flightId, eventId, timestamp, details Json }` → `Event` → `Severity`.
- `EventService.registerManyFlightEvents()` (`backend/src/modules/event/services/event.service.ts`) já grava eventos em lote.
- O seed `backend/prisma/seed/eventsListSeed.ts` já é uma **árvore de checklist** `FASE → SUBFASE → ITEM → SEVERIDADE → eventos`, hoje toda A320 (ECAM, FCU, ADIRS, ACCU PRESS, THRUST LEVERS...).

Ou seja: **não vamos reinventar o domínio de scoring — vamos alimentá-lo**. O app desktop é o "cliente ACARS" que detecta qual `Event` da árvore disparou e faz POST dos `FlightEvent`s.

Decisões já tomadas com o usuário:
- **Framework:** Tauri + React.
- **Escopo:** multi-aeronave desde já (config genérica por modelo).
- **Regras:** declarativas via DB/JSON servidas pelo backend (não em código).

> Este é um documento de **investigação e arquitetura** (não um passo-a-passo de implementação final). Ele estabelece a fundação; o MVP de código vem em seguida.

---

## O problema central: "taxiando, decolando ou pousando?"

A confusão (mesma velocidade significa coisas diferentes) se resolve com uma **máquina de estados de fase (FSM) com travamento/histerese**. Nenhuma regra olha um dataref isolado — toda regra é avaliada **dentro do contexto de uma fase**. O mesmo `groundspeed = 60kt` é violação no TAXI e normal na DECOLAGEM/POUSO.

### FSM de fases (estados)

```
PREFLIGHT → COCKPIT_PREP → ENGINE_START → TAXI_OUT → TAKEOFF →
CLIMB → CRUISE → DESCENT → APPROACH → LANDING(rollout) → TAXI_IN → SHUTDOWN
```

A transição usa **combinação de datarefs + travamento** (uma vez que esteve no ar, não pode voltar a "TAXI" até desacelerar e sair da pista). Datarefs de decisão (nomes reais do X-Plane):

| Sinal | Dataref | Uso |
|---|---|---|
| No solo | `sim/flightmodel/failures/onground_any` (ou `sim/flightmodel2/gear/on_ground[]`) | base de quase tudo |
| Groundspeed | `sim/flightmodel/position/groundspeed` (m/s → ×1.94384 = kt) | limite de taxi |
| IAS | `sim/flightmodel/position/indicated_airspeed` (kt) | decolagem/aproximação |
| Vertical speed | `sim/flightmodel/position/vh_ind_fpm` | subindo/descendo |
| Altitude AGL | `sim/flightmodel/position/y_agl` (m) | airborne real |
| N1 / motor rodando | `sim/flightmodel/engine/ENGN_running[]`, `sim/cockpit2/engine/indicators/N1_percent[]` | start, takeoff thrust |
| Parking brake | `sim/cockpit2/controls/parking_brake_ratio` | gate/start |
| Trem | `sim/cockpit2/controls/gear_handle_down` | takeoff/landing |
| Flaps | `sim/cockpit2/controls/flap_ratio` | takeoff/approach |

Exemplos de transição (resolvem a dúvida):
- **TAXI_OUT:** `onGround && groundspeed>~1kt && enginesRunning && !jáDecolou`. ⇒ regra de **≤30kt armada só aqui** (e em TAXI_IN).
- **TAKEOFF:** `onGround && IAS subindo >~50kt && N1≈takeoff`. (≠ taxi pela aceleração + N1 alto.)
- **CLIMB:** transição quando `onGround=false && y_agl>~10ft`. Trava `jáDecolou=true`.
- **LANDING/rollout:** `jáDecolou && voltou onGround=true`. Aqui `groundspeed>30kt` é **normal** — a regra de taxi não está armada.
- **TAXI_IN:** após rollout, quando `groundspeed<~30kt` e desacelerando para gate.

Cada fase também emite eventos OUT/OFF/ON/IN que viram os timestamps ACARS do `Flight`.

---

## Arquitetura

### Camadas do app desktop (Tauri)

```
┌─────────────────────── Tauri (Rust core) ───────────────────────┐
│  X-Plane Connection Manager                                      │
│   • HTTP (reqwest): bootstrap — resolve nome→id de dataref,      │
│     lista de commands, leituras one-shot, writes                 │
│   • WebSocket (tokio-tungstenite): dataref_subscribe_values,     │
│     stream 10Hz dataref_update_values, reconexão automática      │
│   • Normaliza o frame e emite evento `xplane://dataref-frame`    │
│   → roda em background, SEM problema de CORS (não é o webview)   │
└──────────────────────────────────────────────────────────────────┘
              │ Tauri events (dataref frames)        │ invoke (connect/write)
┌──────────────────────────── React (TS) ─────────────────────────┐
│  1. Dataref Store (zustand)  – último valor de cada dataref      │
│  2. Phase FSM                – calcula a fase atual + travas      │
│  3. Rule Engine              – avalia regras declarativas da fase │
│  4. Event Buffer/Sync        – POST FlightEvents p/ NestJS (axios)│
│  5. UI                       – fases, checklist ao vivo, score    │
└──────────────────────────────────────────────────────────────────┘
              │ axios (JWT)
        Backend NestJS (já existe) ── Postgres/Prisma
```

**Por que a I/O em Rust:** evita CORS (X-Plane não tem auth, é localhost; um webview/browser bloquearia), permite rodar em background e reconectar sem depender do ciclo do React. O motor de regras fica em TS porque é onde mora a config declarativa e a expertise do time; o load de 10Hz é trivial.

### Aquisição de dados — WS vs HTTP

- **IDs de dataref são por-sessão** (mudam a cada restart do X-Plane). No connect, o Rust faz `GET /api/v3/datarefs?filter=<name>` para montar o mapa `nome→id`, depois `dataref_subscribe_values` por id.
- **WebSocket = canal primário** (stream 10Hz, só valores que mudaram).
- **HTTP = bootstrap + one-shot** (resolver ids, ler valor pontual via `GET /datarefs/{id}/value`, escrever via `PATCH`, listar `commands`).
- Conjunto de datarefs a subscrever = união dos datarefs referenciados pelas regras do modelo de aeronave carregado + os datarefs da FSM.

---

## Arquitetura & Design Patterns

O app desktop **não é um CRUD de telas** — é um **motor de stream processing**: processa um fluxo contínuo (10Hz de datarefs) e emite eventos. Tudo gira em torno de um **fluxo unidirecional**:

```
[X-Plane] → Ingest → Normalize → Phase FSM → Rule Engine → Event Log → Sink(backend)
            (adapter)  (alias+unidade)  (estado)   (strategy)   (projeção→score)
```

Cada estágio é puro e testável: um "frame" entra de um lado; se algo foi violado/cumprido, sai um `FlightEvent` do outro.

### Padrões usados (onde e por quê)

**1. Ports & Adapters (Hexagonal) — limite do sistema.** O núcleo (FSM + regras) não sabe que existe X-Plane; depende de *portas*:
```ts
interface TelemetrySource { connect(cfg): Promise<void>; onFrame(cb:(raw:RawFrame)=>void): Unsubscribe; } // entrada
interface EventSink       { emit(events: FlightEvent[]): Promise<void>; }                                  // saída
```
Adapters: `XPlaneTauriSource` (produção, via Rust), `ReplaySource` (lê voo gravado em JSON — **é assim que se "testa" sem o sim**), `MockSource` (unit), `BackendEventSink`/`ConsoleSink`. ⇒ trocar X-Plane→MSFS = novo adapter, núcleo intacto.

**2. State Machine (FSM pura) — detecção de fase.** Função pura `(frame, prev) → PhaseState`, sem I/O, carregando as travas (`jáDecolou`) que resolvem "taxi vs pouso". ⇒ determinístico e replayável.

**3. Strategy — um avaliador por tipo de regra.** Os 4 tipos **não viram um `switch`**; cada um implementa a mesma interface e é registrado num mapa:
```ts
interface RuleEvaluator { evaluate(rule: Rule, ctx: EvalContext): RuleOutcome | null; }
class SnapshotEvaluator implements RuleEvaluator {/*...*/}      // entra/sai da fase
class ContinuousEvaluator implements RuleEvaluator {/*...*/}    // viola enquanto na fase
class PreconditionEvaluator implements RuleEvaluator {/*...*/}  // no gatilho, exige condição
class SequenceEvaluator implements RuleEvaluator {/*...*/}      // compara timestamps
const evaluators = new Map<RuleType, RuleEvaluator>([/*...*/]);
```
⇒ Open/Closed: 5º tipo (ex.: `rate`) = classe nova, não toca no resto.

**4. Interpreter — a mini-DSL do `expr`.** `"groundspeed_kt > 30"` é parseado uma vez em AST e interpretado (avaliador seguro, sem `eval`). O **mesmo pacote** roda no desktop (executa), no backend (valida no "Publicar") e no botão "Testar" — fonte única da sintaxe.

**5. Observer — store reativo.** `DatarefStore` (zustand) é Observable: o pipeline escreve, a UI observa. A UI nunca fala com o X-Plane; só lê o store.

**6. Event Log + Projection (sabor Event Sourcing) — scoring.** Os `FlightEvent` são um **log append-only**; `score` + os 4 contadores são uma **projeção** (fold) sobre o log. Recalcular score = reprocessar eventos. Auditável; mudar pesos não perde dados.

### O "tick": como um frame atravessa tudo

O orquestrador só **costura** os estágios — a lógica mora em cada um:
```ts
source.onFrame((raw) => {
  const frame    = normalizer.normalize(raw);            // alias + kt/ft
  store.setFrame(frame);                                 // Observer → UI
  const phase    = phaseMachine.next(frame, store.phase);
  store.setPhase(phase);
  const outcomes = ruleEngine.evaluate(frame, phase);    // só regras armadas p/ a fase
  const events   = outcomes.filter(o => o.fired).map(toFlightEvent);
  eventBuffer.add(events);                               // dedup + batelada
});
eventBuffer.flushEvery(5_000, (batch) => sink.emit(batch)); // POST em lote
```
`ruleEngine.evaluate` filtra as regras da fase → delega cada uma à Strategy via `Map<RuleType, RuleEvaluator>` → coleta `RuleOutcome[]`.

### Backend/admin — deliberadamente "chato" (segue o repo)

- **Layered + Repository** (NestJS controller→service→repository), igual a `modules/event` e `modules/aircraft`.
- **CQRS-lite + versionamento**: admin escreve no DRAFT (*command*); desktop lê só o PUBLISHED (*query*); "Publicar" separa os dois mundos.
- Frontend admin reusa o padrão **service + React Query hooks + diálogos MUI** do exam-templates.

### Trade-offs (por que assim)

| Decisão | Ganho |
|---|---|
| Pipeline + portas | Testar voo inteiro com `ReplaySource` sem sim; trocar sim sem mexer no núcleo |
| Regras declarativas + Interpreter | Mudar validação **sem deploy** (requisito do admin) |
| Strategy por tipo de regra | Novo tipo = classe nova (Open/Closed) |
| FSM pura | Determinismo + replay p/ depurar "por que essa fase?" |
| Event log → projeção | Score recomputável e auditável; o log é a verdade |

> **A sacada que conecta tudo:** *a regra é dado, não código.* O admin produz dados (regras + aliases); o desktop é um **interpretador genérico** desses dados. Nenhum dos dois precisa saber do outro além do contrato JSON.

## Motor de regras declarativo

Cada item da árvore de checklist (`Event` existente) vira uma ou mais **regras declarativas**, versionadas **por modelo de aeronave**, servidas pelo backend. Tipos de regra necessários (cobrem os 4 exemplos do usuário):

| Tipo | Descrição | Exemplo |
|---|---|---|
| `snapshot` | Avaliada ao **entrar numa fase / checkpoint**; condição deve valer naquele instante | "ALT do piloto automático setado antes de acionar motores" |
| `continuous` | Constraint mantida **durante toda a fase**; violação gera evento | "Taxi ≤ 30kt" |
| `precondition` | Quando um **gatilho** dispara, uma condição deve **já estar** verdadeira | "Hidráulico amarelo OK **antes** de acionar motores" |
| `sequence` | Ordem temporal entre dois eventos detectados | "Motor 2 acionado **antes** do Motor 1" |

Esboço do schema da regra (servido como JSON pelo backend):

```jsonc
{
  "id": "rule_xxx",
  "aircraftModelCode": "A320",
  "eventLogicalId": "[TAXI][SPEED][TAXI_SPEED][SAFETY_COMPROMISE][01]", // liga ao Event/Severity existente
  "phase": "TAXI_OUT",
  "type": "continuous",
  "datarefs": ["sim/flightmodel/position/groundspeed"],
  "expr": "groundspeed_kt > 30",          // mini-DSL avaliada com segurança (sem eval)
  "params": { "graceMs": 2000 },           // tolerância p/ ruído
  "details": ["groundspeed_kt", "y_agl"]   // o que gravar em FlightEvent.details
}
```

- A `expr` é avaliada por um **avaliador seguro** (ex.: jsep/expr-eval, sem `eval`), com variáveis = datarefs normalizados (já convertidos p/ kt, ft, etc.).
- Cada regra referencia um `Event.logicalId` existente → mantém severidade e contagem de scoring **sem duplicar** o domínio.
- **Multi-aeronave:** as regras são escopadas por `aircraftModelCode`. Aeronaves Airbus (A320) e Boeing (B738) têm datarefs/itens diferentes; o app carrega apenas o conjunto do modelo do voo atual.

---

## Mudanças no backend (NestJS / Prisma)

Aditivas, reusando o que existe:

1. **Hierarquia relacional + versionada** (`schema.prisma`): a árvore hoje gerada por script (`eventsListSeed.ts`, com a hierarquia escondida dentro do `logicalId`) vira **tabelas editáveis** — ver seção "Gestão de Validações e Procedimentos". Em resumo: `ProcedureVersion` (por `AircraftModel.code`, status `DRAFT|PUBLISHED|ARCHIVED`) → `Phase` → `SubPhase` → `ChecklistItem` → `Event` (leaf, mantém `severityId`) → `ValidationRule` (dataref + condição).
2. **`ValidationRule`** liga um `Event` a datarefs + condição (tipos `snapshot|continuous|precondition|sequence`), escopado pela versão/modelo. É a ponte "Event ↔ dataref/condição" que hoje não existe.
3. **Endpoints novos** (módulo `flight`/novo módulo `acars` + módulo `procedures`):
   - `GET /procedures/published?aircraftModelCode=A320` → pacote da versão **publicada** (fases + itens + regras + datarefs/commands a subscrever) consumido pelo app desktop no início do voo. (Substitui o "seed estático" referenciado antes.)
   - `POST /flight/:id/events` (JWT) → ingestão de `FlightEvent[]` em lote, reusando `EventService.registerManyFlightEvents`. Hoje `FlightController` só tem `GET me/:id` e `PATCH review/:id`.
   - `POST /flight/start` / `PATCH /flight/:id/acars` → cria/atualiza o `Flight` da sessão e grava `OUT/OFF/ON/IN`.
4. **Recompute de score:** ao fechar o voo, recalcular `score` + os 4 contadores a partir dos `FlightEvent`s (lógica de pontuação a definir — fora do MVP de captura).
5. **Auth:** o app desktop autentica com o mesmo login JWT do backend (reusa `auth.service` do frontend).

> **Migração de dados:** um importador converte a árvore atual de `eventsListSeed.ts` na versão 1 (PUBLISHED) do A320 nas novas tabelas — nada de conteúdo existente se perde.

---

## Gestão de Validações e Procedimentos (Admin Front-End)

Painel **admin no site** (não no desktop) para pilotos/instrutores criarem e manterem os procedimentos operacionais e as regras de validação, **sem deploy**. É o que torna a config declarativa realmente viva: o app desktop apenas **consome** a versão publicada.

### O que muda no modelo de dados (de seed estático → DB editável)

Hoje a hierarquia só existe dentro da string `logicalId` e é gerada por script. Para editar pelo front, ela vira relacional e versionada:

```
AircraftPackage { code, model, author }              // "A320-ToLiss" — datarefs são por PACOTE, não por modelo
  └─ DatarefCatalog { alias, datarefName, unit, valueType, arrayIndex?, description }
                                                       // alias lógico (yellow_accu_psi) → dataref real do pacote
AircraftModel (existe)
  └─ ProcedureVersion { version, status: DRAFT|PUBLISHED|ARCHIVED, publishedAt }
       └─ Phase { name, order }                      // TAXI_OUT, ENGINE_START...
            └─ SubPhase { name, order }
                 └─ ChecklistItem { name, order, verifiability: AUTO|MANUAL|NOT_SIMULATED, source: FCOM|OPERATOR_POLICY }
                      └─ Event (existe: name, severityId, reference, description)
                           └─ ValidationRule { type, phase, aliases[], expr, params, details[] }
```

- `Event` e `Severity` **são reusados** (não duplicamos scoring); ganham FK para `ChecklistItem`.
- Tudo pendura numa `ProcedureVersion` ⇒ editar um rascunho **não afeta** voos em andamento.
- **`verifiability`**: nem todo item do FCOM é observável por dataref (walkaround "CONDITION", "EMER EQPT CHECK" são visuais). `AUTO` tem `ValidationRule` e pontua sozinho; `MANUAL` é auto-atestado/informativo; `NOT_SIMULATED` não existe no sim. Evita falsos eventos em itens invisíveis.
- **Aliases, não datarefs crus**: a regra referencia **aliases lógicos** (ex.: `yellow_accu_psi`) resolvidos pelo `DatarefCatalog` do pacote em uso (ToLiss `AirbusFBW/...` vs Laminar `sim/...`). A mesma regra lógica roda em add-ons diferentes; `expr` continua escrita sobre variáveis normalizadas.

### Versionamento: Rascunho → Publicar

- Admin sempre edita o **DRAFT** do modelo. Pode haver no máximo 1 DRAFT + 1 PUBLISHED por `aircraftModelCode`.
- **Publicar**: valida tudo (datarefs existem no catálogo, `expr` faz parse, eventos têm severidade) → DRAFT vira PUBLISHED, o PUBLISHED anterior vira ARCHIVED (histórico/rollback). Bump de `version`.
- App desktop só baixa `status=PUBLISHED` (`GET /procedures/published`). "Editar a versão publicada" cria automaticamente um novo DRAFT (clona a publicada).

### UI admin (segue o padrão de exam-templates/questions)

Nova rota `frontend/src/routes/_auth/_admin/admin/procedures/*`, gated por `ACCESS_ADMIN_PANEL` (`_auth/_admin.tsx`) + nova permissão `MANAGE_PROCEDURES`.

- **Seletor topo:** modelo de aeronave + versão (Draft em edição / Published em leitura).
- **Árvore editável** (esquerda): Phase → SubPhase → Item → Event, com CRUD por nível via diálogos MUI (mesmo padrão de `pages/exam/exam-template-dialog.tsx`), reordenação por `order`.
- **Editor de regra** (direita, ao selecionar um Event):
  - Tipo: `snapshot | continuous | precondition | sequence`.
  - **Builder guiado** (caso comum): dropdown de **alias** de dataref (do `DatarefCatalog` do pacote) + operador + valor + fase + severidade + campos de `details` + `graceMs`.
  - **Verificabilidade** do item: `AUTO | MANUAL | NOT_SIMULATED` (só `AUTO` exige regra/pontua).
  - **Toggle "expressão avançada"**: editor de texto com a mini-DSL para regras complexas (múltiplas condições, sequence/precondition).
  - **Botão "Testar"**: avalia a `expr` contra um frame de dataref de exemplo (colar JSON, ou puxar um snapshot ao vivo de um desktop conectado numa fase futura) e mostra `true/false` + variáveis resolvidas.
- **Catálogo de datarefs:** CRUD simples por modelo (nome, unidade, tipo) que alimenta os dropdowns — evita digitar nomes de dataref errados.
- **Publicar / histórico:** botão publicar com o relatório de validação; lista de versões com diff/rollback.

### Reuso de padrões existentes
- **Serviços:** `frontend/src/services/latam/procedures.service.ts` (axios `api`, REST), espelhando `exam.service.ts`.
- **Hooks:** `frontend/src/hooks/procedures/*` com `useQuery`/`useMutation` + `invalidateQueries`, igual a `hooks/exam/useQuestions.ts`.
- **Backend:** novo módulo `procedures` (controller/service/repository) no padrão de `modules/event` e `modules/aircraft`; guard de permissão como `flight-permission.guard.ts`.
- **Avaliador de `expr`:** **o mesmo** módulo usado no rule engine do desktop (parser seguro, ex.: expr-eval) roda também no backend para a validação do "Publicar" e no botão "Testar" — fonte única de verdade da sintaxe.

## Estrutura no monorepo

Novo pacote irmão de `frontend/` e `backend/`:

```
latamv-monorepo/
  desktop/                 # app Tauri
    src/                   # React (reusa libs do frontend: zustand, axios, MUI, react-query)
      xplane/              # client (invoke Rust), dataref store, id resolver
      phase/               # FSM de fases + travas
      rules/               # engine (avaliador seguro), tipos de regra
      sync/                # buffer + POST de FlightEvents (axios + JWT)
      ui/                  # telas: conexão, fases ao vivo, checklist, score
    src-tauri/             # Rust: connection manager (reqwest + tungstenite), eventos
  frontend/                # ganha a área admin de procedimentos
    src/routes/_auth/_admin/admin/procedures/*
    src/pages/procedures/*  src/hooks/procedures/*  src/services/latam/procedures.service.ts
  backend/                 # ganha o módulo `procedures` + tabelas novas
    src/modules/procedures/*
```

Reaproveita versionamento via `scripts/sync-versions.js`. O **avaliador de `expr`** e os **tipos** (Event/Severity/Rule/Phase) são candidatos a um pacote compartilhado entre `desktop`, `frontend` e `backend` — fonte única da sintaxe das regras.

---

## Faseamento (milestones)

**Trilha A — App desktop (captura/validação)**
1. **Spike de conexão (Rust):** conectar no X-Plane, resolver `nome→id`, subscrever ~5 datarefs e logar o stream 10Hz no console do app. Valida a ponte Rust→React.
2. **Dataref Store + telemetria ao vivo:** UI mostrando groundspeed/IAS/AGL/N1 em tempo real (com conversões de unidade).
3. **FSM de fases:** implementar transições + travas; exibir a fase atual e os marcos ACARS (OUT/OFF/ON/IN).
4. **Rule Engine (MVP A320):** avaliador seguro + os 4 tipos de regra, validados com os 4 exemplos do usuário; eventos detectados aparecem na UI.

**Trilha B — Backend + Admin (gestão dos procedimentos)**
5. **Modelo relacional + migração:** `ProcedureVersion/Phase/SubPhase/ChecklistItem/ValidationRule/DatarefCatalog`; importador que converte `eventsListSeed.ts` na v1 publicada do A320.
6. **Endpoints:** CRUD de procedimentos/regras/catálogo, `publish`, e `GET /procedures/published` (consumido pela trilha A) + `POST /flight/:id/events`.
7. **Admin UI:** árvore editável + editor de regra (builder guiado + expr avançada + "Testar") + publicar/histórico, no padrão exam-templates.

**Integração**
8. **Sync end-to-end:** desktop baixa a versão publicada, valida o voo, faz `POST events`; admin edita e republica.
9. **Multi-aeronave:** segundo modelo (ex.: B738) inteiramente via admin, sem novo código de engine — prova a generalização.

---

## Verificação (end-to-end)

- **Conexão:** com X-Plane rodando (`--web_server_port=8086`), confirmar no app o stream 10Hz; matar/reabrir o WS e ver reconexão automática.
- **Fases:** num voo curto (taxi → decolagem → pouso), confirmar a sequência da FSM e que **o limite de 30kt só dispara no taxi**, não na decolagem/pouso (o ponto-chave da dúvida).
- **Regras (os 4 exemplos):** forçar cada cenário no sim — ENG1 antes do ENG2 (`sequence`), hidráulico amarelo despressurizado no start (`precondition`), ALT do A/P não setado (`snapshot`), taxi >30kt (`continuous`) — e ver o `FlightEvent` correto com a severidade certa.
- **Backend:** após o voo, `GET /flight/:id` retorna os `FlightEvent`s gravados com `details` (velocidade/altitude) e os contadores de severidade batendo.
- **Multi-aeronave:** trocar `aircraftModelCode` e confirmar que outro pacote de regras é carregado sem mudança de código.
- **Admin (loop completo):** no site, criar/editar uma regra (builder guiado), usar "Testar" com um frame de exemplo, **publicar**; depois iniciar um voo no desktop e confirmar que a regra nova já vale. Editar a publicada deve gerar um novo DRAFT sem afetar o voo em curso.

---

## Decisões em aberto (resolver antes/durante implementação)
- Fórmula de pontuação (`score` + pesos por severidade) ao fechar o voo.
- Como o `Flight` da sessão é criado (a partir de `FlightDuty` existente vs. voo avulso no desktop).
- Curadoria inicial do `DatarefCatalog` por modelo (conhecimento de procedimento) — pode ser semeada e depois mantida pelo admin.
- Granularidade de permissão: reusar `ACCESS_ADMIN_PANEL` ou separar `MANAGE_PROCEDURES` (recomendado p/ delegar a instrutores sem dar acesso total ao painel).

---

## Fontes
- X-Plane Web API: https://developer.x-plane.com/article/x-plane-web-api/
- Lista de datarefs: https://developer.x-plane.com/datarefs/
- FCOM A320 (SOP normais), usado no apêndice: `OpenL-2605301532.md` (raiz do repo).

---

# Apêndice A — Exemplo trabalhado: traduzindo o FCOM A320 em regras

Validação da abordagem contra um manual real (`OpenL-2605301532.md`, *A320 FCOM – Standard Operating Procedures*). Conclusão: o FCOM se traduz **quase 1:1** na árvore + regras, e os 4 tipos de regra cobriram 100% dos casos.

## A.1 Mapa FCOM → árvore

| FCOM (SOP) | Phase | SubPhases (cabeçalhos do FCOM) |
|---|---|---|
| SOP-04 Preliminary Cockpit Prep | `PRELIM_COCKPIT_PREP` | ENG, WEATHER RADAR, L/G, BATTERY, APU |
| SOP-06 Cockpit Preparation | `COCKPIT_PREPARATION` | OVERHEAD, GLARESHIELD/FCU, ADIRS *(já no seed)* |
| SOP-07 Before Pushback or Start | `BEFORE_PUSHBACK_OR_START` | BEFORE/AT START CLEARANCE *(já no seed)* |
| SOP-08 Engine Start | `ENGINE_START` | ENG MODE, ENGINE 2 START, ENGINE 1 START |
| TAXI | `TAXI_OUT` | TAXI CLEARANCE, NOSE light, FLT CTL |
| Takeoff | `TAKEOFF` | THRUST LEVERS, TAKEOFF N1 |

Cada linha pontilhada do manual (`ENG MASTER 2 ... ON`) = um `ChecklistItem`; o `Event` é o desfecho com severidade; a `ValidationRule` é a ponte para os aliases.

> Achado-chave (FCOM linha 1652): *"Engine 2 is usually started first. **It powers the yellow hydraulic system, that pressurizes the parking brake.**"* — dois dos exemplos originais (Motor 2 antes do Motor 1 **e** hidráulico amarelo) são a **mesma cadeia causal** do manual.

## A.2 Os 4 exemplos, ancorados no FCOM

**(a) "Motor 2 antes do Motor 1" — `sequence` · PRO-NOR-SOP-08 P1/8**
```jsonc
{
  "phase": "ENGINE_START", "type": "sequence", "severity": "PROCEDURAL_DEVIATION",
  "eventLogicalId": "[ENGINE_START][START_SEQUENCE][ENG_ORDER][PROCEDURAL_DEVIATION][01]",
  "reference": "PRO-NOR-SOP-08 P1/8",
  "events": [
    { "name": "eng2_start", "when": "eng2_master == 1" },
    { "name": "eng1_start", "when": "eng1_master == 1" }
  ],
  "assert": "t(eng2_start) < t(eng1_start)"
}
```
O engine captura o timestamp da transição 0→1 de cada `ENG MASTER`. Fallback sem dataref de master: primeira subida de `n2[i]` acima de ~5%.

**(b) "Hidráulico amarelo antes do start" — `precondition` · PRO-NOR-SOP-04 P11/12**
```jsonc
{
  "phase": "ENGINE_START", "type": "precondition", "severity": "SAFETY_COMPROMISE",
  "eventLogicalId": "[ENGINE_START][HYD][YELLOW_ACCU][SAFETY_COMPROMISE][01]",
  "reference": "PRO-NOR-SOP-04 P11/12",
  "trigger": "eng2_master == 1",      // ao acionar o 1º motor
  "require": "yellow_accu_psi >= 2500", // já deve estar verdadeiro
  "details": ["yellow_accu_psi"]
}
```

**(c) "ALT do A/P setado antes do start" — `snapshot`** — já existe no seed (`COCKPIT_PREPARATION→GLARESHIELD→FCU→"ALT window set"`); só ganha a ponte:
```jsonc
{
  "phase": "COCKPIT_PREPARATION", "type": "snapshot", "evalAt": "phaseExit",
  "eventLogicalId": "[COCKPIT_PREPARATION][GLARESHIELD][FCU][SAFETY_COMPROMISE][01]",
  "expr": "ap_alt_dial_ft > 0"   // alias → sim/cockpit2/autopilot/altitude_dial_ft_pilot
}
```

**(d) "Taxi ≤ 30 kt" — `continuous` · OPERATOR_POLICY (não está no FCOM)**
O `grep` por "30 kt"/"knots" não retorna nada no FCOM — o limite é **política do operador**, não do Airbus. Justifica a gestão por admin (regras de operador convivem com as do fabricante).
```jsonc
{
  "phase": "TAXI_OUT", "type": "continuous", "source": "OPERATOR_POLICY",
  "eventLogicalId": "[TAXI_OUT][SPEED][TAXI_SPEED][PROCEDURAL_DEVIATION][01]",
  "expr": "groundspeed_kt > 30", "params": { "graceMs": 2000 }
}
```
A FSM garante que esta regra só fica **armada no TAXI** — `groundspeed_kt > 30` no pouso (rollout) não dispara.

## A.3 Dois ajustes que este exercício motivou (já incorporados acima)
1. **`ChecklistItem.verifiability` (`AUTO|MANUAL|NOT_SIMULATED`)** — boa parte da SOP-03/05 (walkaround) é inspeção visual sem dataref; não deve ser auto-pontuada.
2. **`DatarefCatalog` por pacote + camada de alias** — datarefs são específicos do add-on (ToLiss `AirbusFBW/...` vs Laminar `sim/...`); a regra usa aliases lógicos para rodar em pacotes diferentes.
