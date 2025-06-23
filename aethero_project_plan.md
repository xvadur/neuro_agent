## 1. Názov projektu
- **Popis**: Aethero_Xvadur — symbiotická AI entita / osobný AI-first OS / partner pre kogníciu a činy

---

## 2. Vízia a účel
- **Hlavný cieľ**: Vytvoriť otvorenú AI entitu (postavenú na frameworku **Superagent**), ktorá slúži ako osobný operačný systém vedomia, podporuje kogníciu, reflexiu a konanie.
- **Cielená skupina**: Tvorcovia, výskumníci, kreatívci, knowledge workers, AI nadšenci.
- **Očakávaný prínos**:
  - Zosilnenie agency a kognitívnych schopností používateľa.
  - Reflexívne učenie a introspektívna pamäť.
  - Riadenie komplexných projektov a života.
  - Otvorený framework pre budovanie AI agentov, ktorého princípy sú najprv detailne preskúmané a pochopené v **OpenAI Cookbook**.

---

## 3. Architektúra Systému a Technologický Stack

Architektúra je rozdelená do troch kľúčových vrstiev, ktoré zodpovedajú repozitárom v projekte.

### 3.1. R&D a Experimentálna Platforma (`openai-cookbook`)
- **Účel**: Slúži ako naše laboratórium. Všetky nové koncepty a technológie sú tu najprv testované a pochopené v izolácii predtým, ako sa integrujú do produkčného systému.
- **Kľúčové "Recepty" na preskúmanie**:
  - **Pokročilý RAG**: `examples/chat_with_your_own_data.ipynb`, `examples/vector_databases/*`
  - **Tvorba Agentov a Nástrojov**: `examples/agents_sdk/*`, `examples/Assistants_API_overview_python.ipynb`
  - **Spolupráca Agentov**: `examples/agents_sdk/multi-agent-portfolio-collaboration/` (inšpirácia pre CrewAI-like flows)
  - **Multimodalita**: `examples/multimodal/*`, `examples/voice_solutions/*`
  - **Štruktúrované výstupy a Function Calling**: `examples/o1/Using_chained_calls_for_o1_structured_outputs.ipynb`

### 3.2. Jadro Systému: `superagent` Backend & Admin UI
- **Účel**: Produkčný engine, ktorý hostuje a orchestruje všetkých našich agentov.
- **Využívané komponenty "out-of-the-box"**:
  - **API Server**: Hlavné rozhranie pre komunikáciu s agentmi.
  - **Databáza**: `Prisma` + `Postgres` na správu agentov, používateľov, logov a metadát pamäte.
  - **Základná správa agentov**: Vstavané `libs/ui` na rýchlu konfiguráciu a monitoring.
- **Komponenty na vlastné rozšírenie**:
  - **Agenti a Prompty**: Adresár `prompts/` bude obsahovať definície našich "ministrov".
  - **Vlastné Nástroje (Tools)**: Adresár `services/` bude rozšírený o naše špecifické nástroje (napr. pre reflexívnu analýzu).
  - **Orchestračná Logika**: Úprava `app/` na implementáciu vlastných CrewAI-like/LangGraph-like tokov.

### 3.3. Klientská Vrstva: Vlastný Frontend & `superagent-js`
- **Účel**: Vytvorenie unikátneho a na mieru šitého používateľského rozhrania pre interakciu s Aethero.
- **Technológie**:
  - **SDK**: `superagent-js` na prepojenie nášho frontendu so `superagent` backendom.
  - **UI Framework**: `React` / `Next.js`
  - **Komponenty**: Vlastné komponenty pre vizualizáciu pamäte, chat a správu úloh.

### 3.4. Externé Služby a Integrácie
- **AI Modely**: OpenAI API (GPT-4o), HuggingFace (Claude, LLaMA3, Mistral) pripojené cez `superagent`.
- **Vektorová Pamäť**: Pinecone / Chroma ako externá služba pripojená k `superagent` pre RAG.
- **Identita & Auth**: Clerk / OAuth integrované do vlastného frontendu a `superagent` backendu.
- **Workflows & Automatizácia**: n8n / Pipedream na prepojenie agentov s externým svetom cez API volania.

---

## 4. Hlavné Moduly a Funkcionality (mapované na architektúru)
- **Premier Agent (Aethero_Xvadur)**:
  - *Implementácia*: Ako hlavný agent nakonfigurovaný v `superagent`.
- **Reflexívna vrstva (meta-vedomie)**:
  - *Implementácia*: Ako špeciálny agent alebo cron job v `superagent` backende (`services/`), ktorý periodicky analyzuje dáta z Prisma DB a vektorovej databázy.
- **Multi-ministrová architektúra**:
  - *Implementácia*: Každý "minister" je samostatný agent v `superagent` s vlastnými promptami a priradenými nástrojmi.
- **Knowledge RAG**:
  - *Implementácia*: Využitie vstavanej RAG funkcionality v `superagent`, napojenej na našu vektorovú databázu. Nové RAG techniky sa prototypujú v `cookbook`.
- **Memory Explorer UI**:
  - *Implementácia*: Kľúčová súčasť vlastného frontendu, ktorá cez `superagent-js` načíta dáta a vizualizuje ich (timeline, graf).

---

## 5. Dáta a Pamäť
- **Krátkodobá pamäť**: Runtime `superagent` agenta.
- **Dlhodobá pamäť (konverzácie, metadáta)**: `Prisma DB` v rámci `superagent` stacku.
- **Vedomostná a reflexívna pamäť**: `Pinecone / Chroma` (vektorová databáza).

---

## 6. MVP (Minimálna funkčná verzia)
- **Časový rámec**: 1–3 mesiace
- **Cieľ**: Overiť end-to-end architektúru od experimentu po funkčného agenta.

- **Fáza 1: Experiment (v `openai-cookbook`)**:
  - 1a. Vytvoriť a pochopiť notebook pre RAG s vlastnými PDF súbormi.
  - 1b. Vytvoriť proof-of-concept skript pre jednoduchú multi-agent komunikáciu.

- **Fáza 2: Integrácia Jadra (v `superagent`)**:
  - 2a. Rozbehnúť a nakonfigurovať lokálnu inštanciu `superagent`.
  - 2b. Vytvoriť "Premier agenta" a dvoch "ministrov" (napr. Výskum, Projektové Riadenie) cez `superagent` UI/konfiguráciu.
  - 2c. Pripojiť RAG (overený v kroku 1a) k "Výskumnému ministrovi".

- **Fáza 3: Základné UI (vlastný Frontend + `superagent-js`)**:
  - 3a. Vytvoriť jednoduchú React aplikáciu.
  - 3b. Pomocou `superagent-js` sa pripojiť k backendu a zobraziť streamovanú odpoveď od "Premier agenta".

---

## 7. Pokročilé funkcionality (Roadmapa)
- **Full vláda agentov (10+)**: Rozširovanie agentov v `superagent`.
- **Dynamické workflows**: Implementácia vlastnej orchestračnej logiky v `superagent` backende.
- **Vlastný frontend UI**: Plnohodnotný vývoj UI pre Memory Explorer a správu agentov.
- **Multimodalita**: Integrácia `Whisper` a `GPT-4 Vision` nástrojov do `superagent` agentov po overení v `cookbook`.

---

## 8. Stakeholderi a validácia
- **Stakeholderi**: Adam Rudavský (owner), budúci power users / AI komunitné kruhy.
- **Validácia**: Spätná väzba pri používaní vlastného systému; testovanie v reálnych projektoch; komunitné review.

---

## 9. Fázy Vývoja
- **Fáza 1 (1–3 mesiace)**: MVP — Zvládnutie `cookbook` princípov, nasadenie `superagent` jadra, vytvorenie prvých agentov a základného UI.
- **Fáza 2 (3–6 mesiacov)**: Rozšírenie — Implementácia reflexívnej vrstvy, vývoj pokročilého UI pre pamäť, pridanie ďalších "ministrov".
- **Fáza 3 (6–12 mesiacov)**: Zrelosť — Plná vláda agentov, dynamické workflows, multimodalita a príprava na open-source release.

---

## 10. Log pokroku
- [2025-06-23] Inicializácia projektu — zápis do AI Project Template na báze cookbook + superagent stacku.
- [2025-06-23] Definícia MVP a prepracovanie plánu podľa architektúry stacku.

---

# Poznámka k stacku (prečo táto architektúra):
- **`openai-cookbook`**: Je našou telocvičňou a laboratóriom. Tu sa učíme a inovujeme bez rizika.
- **`superagent`**: Je naším priemyselným motorom. Poskytuje 80% potrebnej infraštruktúry, aby sme sa mohli sústrediť na inteligenciu a logiku, nie na boilerplate.
- **`superagent-js` + Vlastný Frontend**: Je naša tvár a ruky. Umožňuje nám vytvoriť jedinečný zážitok pre používateľa, ktorý nie je obmedzený vstavaným UI.

➡️ Táto kombinácia nám dáva **rýchlosť** (vďaka `superagent`), **hĺbku pochopenia** (vďaka `cookbook`) a **flexibilitu** (vďaka vlastnému UI), čo je ideálne pre budovanie transparentného, modulárneho a mocného AI partnera.

