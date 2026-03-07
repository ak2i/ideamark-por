---
ideamark_version: "1.0.3"
doc_id: "ideamark.por.v0.1.0.dev-spec.v0.0.1.2026-03-07"
doc_type: "evolving"
status:
  state: "in_progress"
created_at: "2026-03-07T00:00:00Z"
updated_at: "2026-03-07T00:00:00Z"
lang: "ja-JP"
title: "IdeaMark-POR v0.1.0 Development Specification (v0.0.1)"
---

# IdeaMark-POR v0.1.0 Development Specification

本仕様は **Progressive Occurrence Resolution (POR)** エンジンの
初期アーキテクチャを定義する。

POR は

- 長文文書
- ストリーム入力
- LLM補助抽出

を組み合わせて  
IdeaMark 構造を **逐次構築する状態保持型エンジン**である。

本リポジトリでは

- PORアルゴリズム
- 内部IR
- セッション状態管理
- LLMオーケストレーション

を扱う。

IdeaMark CLI は引き続き

**stateless document operation tool**

として位置づける。

---

# SEC-ARCHITECTURE-CONTEXT

```yaml
section_id: "SEC-ARCHITECTURE-CONTEXT"
anchorage:
  view: "background"
  phase: "design"
  domain: ["por","architecture"]
```

IdeaMark 文書は

* PDF
* 論文
* 政策文書
* 議論ログ

などから生成されることを想定している。

しかし従来の生成方式には次の問題がある。

* 長文文書のコンテキスト制限
* 要約バイアス
* Entity配置誤り
* 文脈回収構造への非対応

これらを解決するため
**ストリーム型解釈エンジン**

POR を導入する。

---

# SEC-PROBLEM-POR

```yaml
section_id: "SEC-PROBLEM-POR"
anchorage:
  view: "problem"
  phase: "design"
```

IdeaMark 文書生成を LLM の単発生成に依存すると

1. Entity配置が不安定
2. 文書後半の情報を反映できない
3. 複数解釈を扱えない

特に

**文書進行に伴う意味変化**

に対応できない。

例

* 研究論文
* 政策報告
* 物語構造

これらでは

**後半で意味が回収される Entity**

が頻繁に出現する。

---

# SEC-CONSTRAINTS

```yaml
section_id: "SEC-CONSTRAINTS"
anchorage:
  view: "constraint"
  phase: "design"
```

POR は次の前提で設計する。

入力

* 文書はチャンク単位で到着

構造

* Entity は複数 Occurrence を持つ
* Section は Entity配置の文脈単位

更新ルール

* 既存 Occurrence の上書きは禁止
* 再解釈は新 Occurrence を追加

時間

* 文書順序は重要な意味を持つ

---

# SEC-OPTION-POR-ENGINE

```yaml
section_id: "SEC-OPTION-POR-ENGINE"
anchorage:
  view: "analysis"
  phase: "design"
```

IdeaMark生成エンジンの候補。

### Option 1 — LLM Single Shot

全文を入力し IdeaMark 文書を生成。

問題

* コンテキスト制限
* 要約バイアス

---

### Option 2 — Chunk Independent

チャンクごとに IdeaMark を生成し結合。

問題

* 文脈断絶
* Entity配置不整合

---

### Option 3 — Progressive Occurrence Resolution

チャンクごとに Entity を抽出し
スコア更新により配置を決定する。

---

# SEC-DECISION-POR-ENGINE

```yaml
section_id: "SEC-DECISION-POR-ENGINE"
anchorage:
  view: "decision"
  phase: "design"
```

IdeaMark生成エンジンとして

**Progressive Occurrence Resolution (POR)**

を採用する。

POR は

* ストリーム解釈
* スコア更新
* 時間窓制御
* Occurrence凍結

を組み合わせたアルゴリズムである。

---

# SEC-POR-SCORE-ALGORITHM

```yaml
section_id: "SEC-POR-SCORE-ALGORITHM"
anchorage:
  view: "solution"
  phase: "design"
```

Entity の配置候補は

```
entity × section × role
```

ごとにスコアを持つ。

スコアは次で評価する。

```
total_score = Σ log(match_score)

facet_support = distinct_feature_count

confidence = total_score × facet_support
```

ここで

match_score

は

* semantic similarity
* keyword match
* contextual signals

から算出する。

---

# SEC-PLASTIC-WINDOW

```yaml
section_id: "SEC-PLASTIC-WINDOW"
anchorage:
  view: "solution"
  phase: "design"
```

Entity初出チャンクを

k

とする。

更新可能範囲

```
k .. k + W
```

W は通常

```
2〜4 chunks
```

を推奨する。

この範囲を

**plastic window**

と呼ぶ。

---

# SEC-FREEZE-RULE

```yaml
section_id: "SEC-FREEZE-RULE"
anchorage:
  view: "solution"
  phase: "design"
```

Occurrence は次の条件で凍結される。

条件

```
top_score − second_score ≥ Δ
```

かつ

```
facet_support ≥ F
```

凍結後

```
state = frozen
```

となる。

---

# SEC-OCCURRENCE-REINTERPRETATION

```yaml
section_id: "SEC-OCCURRENCE-REINTERPRETATION"
anchorage:
  view: "solution"
  phase: "design"
```

凍結後に新しい文脈が登場した場合

既存 Occurrence は変更しない。

代わりに

```
new occurrence
entity_id = same
```

を生成する。

---

# SEC-IR-ARCHITECTURE

```yaml
section_id: "SEC-IR-ARCHITECTURE"
anchorage:
  view: "design"
  phase: "design"
```

POR 内部では

IdeaMark Markdown を直接編集しない。

内部表現として

```
Tree IR
```

を使用する。

構造

```
Document
 ├ Entities
 ├ Occurrences
 ├ Sections
 └ Relations
```

---

# SEC-STORAGE

```yaml
section_id: "SEC-STORAGE"
anchorage:
  view: "design"
  phase: "design"
```

IR は

以下のストレージを許容する。

```
in-memory
SQLite
future: graph DB
```

SQLite を初期実装とする。

---

# SEC-CLI-DESIGN

```yaml
section_id: "SEC-CLI-DESIGN"
anchorage:
  view: "design"
  phase: "design"
```

POR は CLI ツールとして公開する。

例

```
por init
por ingest
por interpret
por update
por freeze
por status
por export
```

CLI は

**Doc CLI Contract v1.0.3**

に準拠する。

---

# SEC-DOC-CLI-CONTRACT

```yaml
section_id: "SEC-DOC-CLI-CONTRACT"
anchorage:
  view: "constraint"
  phase: "design"
```

POR CLI は

Doc CLI Contract v1.0.3

を実装する。

必須コマンド

```
describe
validate
```

必須トピック

```
describe ai-authoring
describe params
describe capabilities
```

仕様は

```
docs/specs/v1.0.3/
```

を参照する。

---

# SEC-POR-STATE-MACHINE

```yaml
section_id: "SEC-POR-STATE-MACHINE"
anchorage:
  view: "solution"
  phase: "design"
```

POR エンジンは状態機械として動作する。

状態

```
EMPTY
INGESTING
RESOLVING
FROZEN
EXPORT_READY
```

---

# SEC-LLM-ORCHESTRATION

```yaml
section_id: "SEC-LLM-ORCHESTRATION"
anchorage:
  view: "design"
  phase: "design"
```

POR は

LLM + bridge

による外部オーケストレーションを想定する。

構造

```
LLM
↓
Responder Bridge / AIWF
↓
POR CLI
↓
IdeaMark CLI
```

---

# SEC-REPOSITORY-BOUNDARY

```yaml
section_id: "SEC-REPOSITORY-BOUNDARY"
anchorage:
  view: "decision"
  phase: "design"
```

POR は

```
ideamark-por
```

として独立したリポジトリとする。

理由

* 状態管理
* IR
* DB
* ストリーム処理

これらは ideamark-cli の責務を超える。

---

# SEC-ROADMAP

```yaml
section_id: "SEC-ROADMAP"
anchorage:
  view: "plan"
  phase: "draft"
```

v0.1.0 目標

* POR core
* IR
* SQLite storage
* CLI interface
* IdeaMark export

将来

* multi document entity resolution
* POR parameter learning
* distributed processing