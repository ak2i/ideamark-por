---
ideamark_version: "1.0.3"
doc_id: "ideamark.por.v0.1.0.dev-spec.v0.0.3.2026-04-17"
doc_type: "evolving"
status:
  state: "in_progress"
created_at: "2026-03-07T00:00:00Z"
updated_at: "2026-04-17T00:00:00Z"
lang: "ja-JP"
title: "IdeaMark-POR v0.1.0 Development Specification (v0.0.3)"
---

# IdeaMark-POR v0.1.0 Development Specification

本仕様は **Progressive Occurrence Resolution (POR)** エンジンの
初期アーキテクチャを定義する。

POR は

- 長文文書
- ストリーム入力
- LLM補助抽出
- 後方再解釈を含む段階的評価

を組み合わせて、IdeaMark 構造を **逐次構築する状態保持型エンジン**である。

本リポジトリでは

- PORアルゴリズム
- 内部IR
- セッション状態管理
- LLMオーケストレーション
- context_force ベースの再解釈処理

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
* チャット発言集
* 音声由来の逐次表現

などから生成されることを想定している。

しかし従来の生成方式には次の問題がある。

* 長文文書のコンテキスト制限
* 要約バイアス
* Entity配置誤り
* 文脈回収構造への非対応
* 後半による意味反転や回収への弱さ

これらを解決するため
**ストリーム型再解釈エンジン**

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
4. 先行表現の後方再解釈を保持できない

特に

**文書進行に伴う意味変化**
**後半による意味反転**
**結論先出し後解説**
**沈黙や空白を含む作用の変化**

に対応できない。

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
* 処理対象は text だけでなく event-like fragment を含みうる

構造

* POR 初期段階では Entity を直接確定しない
* context_force は分脈に対する作用仮説として扱う
* final occurrence_role とは区別する
* Section は最終的な文脈単位として後段で出現する

更新ルール

* 既存状態の意味を単純上書きしない
* 再解釈は新しい仮説状態として追加する
* freeze 前は plastic を維持する

時間

* 文書順序は重要な意味を持つ
* ただし後方再解釈がありうる

---

# SEC-KEY-DEFINITIONS

```yaml
section_id: "SEC-KEY-DEFINITIONS"
anchorage:
  view: "background"
  phase: "design"
  domain: ["por","terminology"]
```

POR における主要概念を定義する。

### context_force

ある fragment が、現在の分脈に対して果たしている作用の仮説。

例

* 補足
* 反転
* 強化
* 保留
* bridge
* foreshadow
* reframe
* negate
* clarify
* silence-as-tension

### retro_force

後続文脈の出現によって、先行 fragment の役割理解が再位置づけされることを示す仮説。

### force_trace

window 内における context_force / retro_force の連なり。

### force_cluster

overlap / window reconciliation を通じて束ねられた force_trace 群。

### emergent_entity

force_cluster の安定化から出現する、可搬な Entity 候補。

### occurrence_role

最終的な IdeaMark 文書において、Entity が Section 内で担う構造役割。
これは POR 内部の context_force と同一ではない。

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
* 後方再解釈に弱い

---

### Option 2 — Chunk Independent

チャンクごとに IdeaMark を生成し結合。

問題

* 文脈断絶
* force の連続性を保持できない
* Entity配置不整合

---

### Option 3 — Progressive Occurrence Resolution

チャンクごとに context_force を抽出し、
window 単位で比較・再解釈し、
その安定化から Entity / Occurrence / Section を出現させる。

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
* context_force 抽出
* retro_force による後方再解釈
* overlap / window reconciliation
* force_cluster 安定化
* Occurrence / Section 後決定
* freeze / plastic 制御

を組み合わせたアルゴリズムである。

---

# SEC-CONTEXT-FORCE-FIRST-POLICY

```yaml
section_id: "SEC-CONTEXT-FORCE-FIRST-POLICY"
anchorage:
  view: "decision"
  phase: "design"
```

POR は **context_force-first** を主経路として採用する。

原則

* 最初に抽出しやすいのは Entity ではなく fragment の context_force である
* fragment の粒度は単語・文・文節・発話などに固定しない
* 意味の強い断片でも、まずは分脈への作用として保持する
* Entity は force 構造から後段で出現する

ただし

**explicit entity cue path**

を補助経路として残す。

例

* 見出し
* 明示的定義
* 繰り返し現れる安定語彙
* named entity
* 番号付き政策対象

これらは emergent_entity を補助するが、
初期段階で reconciliation を支配してはならない。

---

# SEC-POR-SCORE-ALGORITHM

```yaml
section_id: "SEC-POR-SCORE-ALGORITHM"
anchorage:
  view: "solution"
  phase: "design"
```

POR の主要スコア対象は
初期段階では

```
fragment × context_force × window
```

である。

後段では

```
force_cluster × entity_projection × occurrence_projection × section_projection
```

を評価する。

初期スコア例

```
local_force_score = f(contextual_fit, discourse_signal, ordering_signal, support_signal)
```

統合後スコア例

```
cluster_score = Σ log(local_force_score)
facet_support = distinct_feature_count
confidence = cluster_score × facet_support
```

retro_force が強い場合、
先行 force 仮説は削除ではなく再位置づけされる。

---

# SEC-PLASTIC-WINDOW

```yaml
section_id: "SEC-PLASTIC-WINDOW"
anchorage:
  view: "solution"
  phase: "design"
```

force 初出チャンクを

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

ただし後方再解釈用に、
特定トリガーを検出した場合は
限定的な backward scan を許可する。

例

* 結論表現
* 実は / つまり / 結局
* 定義導入
* セクション終端要約

---

# SEC-RETRO-LAYER-POLICY

```yaml
section_id: "SEC-RETRO-LAYER-POLICY"
anchorage:
  view: "solution"
  phase: "design"
  domain: ["por","retro"]
```

POR は複数レイヤーで後方再解釈を扱う。

### Layer 1 — Local Forward

同一 window 内で、
後続 fragment が前方文脈に対してどう作用するかを抽出する。

### Layer 2 — Local Retro

同一 window 内で、
後続 fragment を見たことで先行 force 仮説を再位置づけする。

例

* resolves_prior
* reframes_prior
* negates_prior
* disambiguates_prior
* reveals_prior_function

### Layer 3 — Long-Range Backward

後続の構造的シグナルにより、
過去の fragment 群を再走査・再評価する。

これは全文の再構築ではなく、
限定的な再位置づけ処理として扱う。

---

# SEC-FREEZE-RULE

```yaml
section_id: "SEC-FREEZE-RULE"
anchorage:
  view: "solution"
  phase: "design"
```

freeze は force / projection 単位で行う。

条件例

```
top_score − second_score ≥ Δ
```

かつ

```
facet_support ≥ F
```

かつ

```
retro_risk ≤ R
```

freeze 後

```
state = frozen
```

となる。

ただし retro_force が十分強い場合は、
既存構造を削除せず、
追加の projection / reinterpretation state を生成する。

---

# SEC-INTERPRETATION-HISTORY-POLICY

```yaml
section_id: "SEC-INTERPRETATION-HISTORY-POLICY"
anchorage:
  view: "constraint"
  phase: "design"
```

POR は解釈履歴を保持する。

原則

* 初期 force 仮説は完全には消さない
* 後方再解釈は追加状態として記録する
* 採用度は変わっても、履歴は traceable であるべき
* IdeaMark synthesis では採択された projection を用いる

これにより、
「なぜその構造が採用されたか」を検査可能にする。

---

# SEC-INGEST-OVERLAP-DEFINITION

```yaml
section_id: "SEC-INGEST-OVERLAP-DEFINITION"
anchorage:
  view: "design"
  phase: "design"
  domain: ["por","ingest","overlap"]
```

**ingest overlap** は、
1つの原入力を複数の ingest chunk に分割して取り込む際に、
隣接 chunk 間で意図的に共有させる内容領域である。

目的は

* chunk 間の順序推定
* 隣接性判定
* 相対位置合わせ
* 重複除去
* 欠落検出

である。

これは意味理解のための overlap ではなく、
**原入力の連続性を回復するための冗長性** として扱う。

---

# SEC-SEMANTIC-OVERLAP-DEFINITION

```yaml
section_id: "SEC-SEMANTIC-OVERLAP-DEFINITION"
anchorage:
  view: "design"
  phase: "design"
  domain: ["por","semantic","overlap"]
```

**semantic overlap** は、
logical segment 単体では十分に確定できない
context_force / force_trace / projection の解釈を補うために、
前後 segment にまたがって共有または参照される文脈範囲である。

目的は

* context_force の切り出し補助
* retro_force の検出補助
* force_trace 連結補助
* occurrence projection の判断補助
* section anchorage 推定補助
* plastic window 内での再配置判断

である。

これは入力復元のための overlap ではなく、
**意味作用の連続性を担保するための解釈上の重なり** として扱う。

---

# SEC-WINDOWED-RECONCILIATION-MODEL

```yaml
section_id: "SEC-WINDOWED-RECONCILIATION-MODEL"
anchorage:
  view: "solution"
  phase: "design"
```

POR は semantic overlap を利用して、
segment 単独では不十分な解釈を
**windowed reconciliation** により安定化する。

基本方針

1. local extraction では context_force 候補を広めに抽出する
2. forward / retro reconciliation で候補を束ねる
3. explicit entity cue は補助的に参照する
4. freeze 前に再評価を許容する

local extraction で保持する候補例

* fragment list
* context_force hypotheses
* retro_force hypotheses
* section hint
* explicit entity cue
* unresolved reference
* confidence

contextual reconciliation で実施する処理例

* force_trace の構築
* force_cluster の統合
* role 競合の解消
* section projection の更新
* occurrence projection の更新
* freeze 判定

---

# SEC-LOGICAL-SEGMENT-INTERPRETATION-POLICY

```yaml
section_id: "SEC-LOGICAL-SEGMENT-INTERPRETATION-POLICY"
anchorage:
  view: "decision"
  phase: "design"
```

logical segment の初期解釈では、
**意味を一度で決め切らない** 方針を採用する。

原則

* 一次処理では force 候補を厚めに残す
* 要約のみで候補を消しすぎない
* summary と force candidate list を併存させる
* 確定は reconciliation と synthesis に委ねる

初期抽出で推奨する妥協案

* segment 内で force-bearing fragment を最大粒度で列挙する
* 各 fragment に context_force を暫定付与する
* 強い explicit entity cue は別レーンで保持する
* 適切な Entity / Occurrence / Section 化は後段で行う

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
Tree IR + force state
```

を使用する。

構造例

```
Document
 ├ Fragments
 ├ ForceHypotheses
 ├ ForceTraces
 ├ ForceClusters
 ├ EmergentEntities
 ├ OccurrenceProjections
 ├ SectionProjections
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
por reconcile
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
FORCE_RESOLVING
RETRO_RECONCILING
PLASTIC
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

利用モデルは固定しない。

* 小規模LLM: local context_force 抽出
* 大規模LLM: force clustering / synthesis 補助

などの分業を許容する。

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
* forward / retro reconciliation
* context_force-first architecture

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
* force-first IR
* SQLite storage
* CLI interface
* IdeaMark export
* explicit entity cue secondary path

将来

* multi document entity resolution
* POR parameter learning
* distributed processing
* audio / silence-aware force extraction
* trigger-oriented entity suggestion

---

# Summary Statement

POR は

**Entity抽出エンジンではない。**

POR は、
fragment が分脈に対して持つ context_force を逐次抽出し、
後方再解釈を含む reconciliation により force 構造を安定化し、
その結果として Entity / Occurrence / Section 候補を出現させる
IdeaMark 前段の解釈エンジンである。
