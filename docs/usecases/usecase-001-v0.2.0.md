# Usecase 001: ingest templateを適用してlogical segments経由でPORに投入しIdeaMark文書を生成

このユースケースは、Usecase 001 を拡張し、入力ファイルをそのままPORに渡すのではなく、
まず ingest chunk として受け取り、適切な ingest template を適用して logical segments に正規化してから
POR で解釈・統合・freeze・export する流れを示す。

想定:
- 入力は PDF / スクリーンショット / 長文テキスト / ログなどであり、そのままではPORに最適化されていない
- シナリオスクリプトは入力特性に応じて ingest template を選択する
- 今回の例では `whitepaper-ingest-v0.1.template.ideamark.md` を利用する
- ingest overlap は入力復元のために使う
- semantic overlap は logical segment の意味解釈安定化のために使う

```mermaid
sequenceDiagram
    autonumber
    actor U as user(人間)
    participant S as シナリオスクリプト
    participant C as ideamark-cli
    participant T as ingest template
    participant A as ai(LLM)
    participant D as PORデーモン(状態遷移マシン)

    Note over U,A: 事前フェーズで入力方針/パラメータ/template選択を相談・確定
    U->>S: 入力ファイル + 実行パラメータで開始

    S->>C: ideamark describe por
    C-->>S: POR状態/遷移/推奨手順

    S->>C: ideamark describe ingest-templates
    C-->>S: 利用可能template一覧と適用条件
    S->>S: 入力特性を見てtemplateを選択
    S->>D: PORセッション開始

    loop ingest chunkごとの正規化
        S->>T: ingest chunkを渡して正規化依頼
        T-->>S: normalized chunk + ingest overlap関係 + layout role hints
        S->>S: chunk順序/隣接/重複を推定
        S->>S: logical segmentsを生成
    end

    loop logical segmentごとの段階的解決
        S->>A: logical segment + 近傍window要約を渡して解釈依頼
        A-->>S: Entity候補群 + 配置案(Section/Occurrence, anchorage/role) + 未確定点

        S->>D: AI解釈結果を投入
        D-->>S: INGESTING / RESOLVING / 状態更新結果
        D-->>S: semantic overlapを踏まえた再配置候補
        D-->>S: 現在状態と次の推奨アクション
    end

    S->>D: freeze判定を要求
    D-->>S: FROZEN / 追加解釈推奨

    S->>D: 文書化を要求
    D->>C: ideamark export
    C-->>D: IdeaMark草稿
    D->>C: ideamark validate
    C-->>D: 検証結果
```

## 変更点の要約

Usecase 001 からの主な変更は次の通り。

1. 入力ファイルをそのままAIへ渡すのではなく、まず ingest chunk として扱う
2. ingest template を選択して normalized chunk を得る
3. normalized chunk から logical segments を生成する
4. POR は logical segments を単位として受け取り、semantic overlap を含む window で再評価する
5. ingest overlap と semantic overlap を別概念として扱う

## このユースケースでの責務分担

### シナリオスクリプト
- 入力方針の確定
- ingest template の選択
- ingest chunk の投入順管理
- logical segment の生成と投入制御

### ingest template
- ingest chunk の正規化
- layout role classification
- noise suppression
- ingest overlap の検出
- logical segment 生成のためのヒント付与

### AI(LLM)
- logical segment 単位の解釈
- Entity候補 / Occurrence候補 / Section候補の抽出
- anchorage / role の仮配置
- 未確定点や再解釈必要点の明示

### PORデーモン
- 状態管理
- semantic overlap を踏まえた candidate の統合
- windowed reconciliation
- freeze 判定
- export 用の構造確定

## 備考

このユースケースでは、ingest template は意味確定を担当しない。
意味確定は POR 側の逐次的な再解釈と freeze の責務とする。

したがって、template の役割は
- 入力を読みやすい単位へ正規化する
- overlap と layout のヒントを与える
- POR が安定して解釈できる logical segment 列を作る

ところまでに限定される。
