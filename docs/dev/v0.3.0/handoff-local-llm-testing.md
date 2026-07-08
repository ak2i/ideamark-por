# 引き継ぎ — ローカル LLM を使った M1 実測フェーズ

Status: handoff note (v0.2.0 M1 実装完了 → ローカル LLM 実測へ)
前提ドキュメント:

- 計画: `docs/dev/v0.2.0/por-v0.2.0-planning.md`
- 凍結済み M1 契約: `docs/dev/v0.2.0/por-m1-text-to-ideamark.md`

## 1. 現在の状態

ブランチ `claude/v0.2.0-planning-dev-46zg4z` に M1(Phase 0〜4)を実装済み。

- `ideamark-por plan` / `ideamark-por generate` が動作する。
- LLM プロバイダは `mock`(決定的・オフライン)と `local`(OpenAI 互換
  chat completions)の 2 つ。`local` は **実モデルでまだ一度も実行していない**。
  これがこの引き継ぎの主目的。
- テストは `npm test` で 15 件(ユニット + mock E2E)。mock E2E は
  `ideamark validate` を errors 0 / warnings 0 で通過する。
- `ideamark-cli`(npm パッケージ)は devDependency として導入済み。
  インストールされるバイナリ名は `ideamark-cli` ではなく **`ideamark`**
  (リゾルバは両名を探すので問題はない)。

## 2. Fedora デスクトップでのセットアップ

```bash
git clone https://github.com/ak2i/ideamark-por.git
cd ideamark-por
git checkout claude/v0.2.0-planning-dev-46zg4z   # main マージ後は main でよい
npm install
npm run check && npm test        # まず全部グリーンなことを確認
npm run build
```

Node 20+ が必要(開発時は v22 で確認)。

### Ollama の場合

```bash
curl -fsSL https://ollama.com/install.sh | sh    # または dnf/公式手順
ollama pull llama3.1:8b
ollama serve   # systemd 経由なら不要
```

デフォルトのエンドポイント `http://localhost:11434/v1` はコード側の既定値
(`src/config.ts` の `M1_DEFAULTS.llm_base_url`)と一致しているので、
Ollama をそのまま使うならフラグ指定は不要。

### LM Studio / その他 OpenAI 互換サーバの場合

```bash
export IDEAMARK_POR_LLM_BASE_URL=http://localhost:1234/v1
export IDEAMARK_POR_LLM_MODEL=<server-side model name>
# 認証が要る場合のみ
export IDEAMARK_POR_LLM_API_KEY=...
```

## 3. 最初の実測コマンド

```bash
# 1) タスク内容の確認(LLM 呼び出しなし)
node dist/main.js plan \
  --source test/fixtures/field-report.txt \
  --projection test/fixtures/observation-projection.yaml

# 2) まず少チャンクで実モデルを試す
node dist/main.js generate \
  --source test/fixtures/field-report.txt \
  --projection test/fixtures/observation-projection.yaml \
  --llm-provider local --llm-model llama3.1:8b \
  --max-chunks 2 \
  --out /tmp/draft.ideamark.yaml

# 3) 問題なければフルラン + 実文書(数万字の実テキスト)で試す
```

サンプル Projection ライブラリを使う場合:

```bash
node dist/main.js generate \
  --source <実テキスト> \
  --projection docs/specs/V1.2.0/sample/projections.yaml \
  --projection-id "projection://samples/observation-to-recommendation/v0" \
  --llm-provider local --out ./out.ideamark.yaml
```

## 4. 何を観察・チューニングするか

セッションディレクトリ(既定 `<out>.por-session/`)を必ず見ること。

| ファイル | 見るポイント |
| --- | --- |
| `matches/<chunk>.json` | 実モデルの JSON 遵守率、warnings(特に `span_not_in_chunk`) |
| `run.json` → `stats` | `retry_count` / `failed_calls`(JSON 不正のリトライ率) |
| `clusters.json` | score 分布、promoted の妥当性 |
| `diagnostics.json` | `ideamark validate` の結果 |

チューニング対象は `src/config.ts` の `M1_DEFAULTS`(M1 契約 §2.5 で
「暫定値・実測で調整」と明記済み):

- `min_match_confidence = 0.35` — 実モデルの confidence 自己申告は楽観的な
  ことが多い。マッチが多すぎるなら上げる。
- `candidate_threshold = 0.5` — promoted 数がゼロ/過多ならここ。
- `chunk_size = 8000` / `chunk_overlap = 2000` — 小型モデル(7〜8B)で
  出力が崩れるならチャンクを小さくするのが第一手。

観察されそうな問題と対処の当たり:

1. **span_text が逐語でない**(モデルが要約してしまう)→ `span_not_in_chunk`
   警告が増え、アンカーが approximate に落ちる。プロンプト
   (`src/llm/promptBuilder.ts`)の verbatim 指示を強化するか、
   ガード側でファジー検索(正規化後の部分一致)を足す。
2. **JSON が壊れる** → リトライ 1 回で吸収できない場合、
   `response_format: {type: "json_object"}` を `localOpenAiProvider` に
   追加する(Ollama 0.5+ / LM Studio は対応。ただし非対応サーバで
   エラーになるためオプション化推奨)。
3. **全スロットに無理やりマッチを返す** → `negative`/`uncertain` の
   使い分けをプロンプトで強調、または min_match_confidence を上げる。

## 5. 実測時の記録先

実測結果は `docs/dev/v0.3.0/` 配下に実験ノートとして残すことを推奨
(例: `experiments/local-llm-run-001.md` に、モデル名、パラメータ、
stats、閾値変更、所感)。閾値の既定値を変えたら M1 契約
(`por-m1-text-to-ideamark.md` §2.5)も追記更新すること。

## 6. M1 で意図的に積み残したもの(v0.3.0 候補)

計画書の「Later modules」に対応。優先度は実測結果次第。

- `describe` 結果の CLI バージョン別キャッシュ(計画書 §Using npm-distributed
  ideamark-cli。M1 は validate 呼び出しのみ実装)。
- 診断からの局所 LLM 修復(`diagnostic_repair_planner`)。M1 は診断を
  保存するだけ。
- text 以外の Source Adapter(`source_adapter_registry`、Markdown ツリー、
  PDF、GitHub リポジトリ等)。
- 複数ソースの `batch_manifest_loader`。
- クロスウィンドウの `partial_match_reconciler`(現状のクラスタリングは
  貪欲な近接マージのみで、open_slot / pending_edge 等の部分状態型は未実装)。
- 複数 Projection の同時実行(現状は 1 Projection、複数ファミリまで対応)。

## 7. 実装上の細かい注意(ハマりどころ)

- **Core 語彙**: `ideamark-cli` 0.3.1 の validate が知っている語彙に合わせ、
  sources の `type` は `document`(stdin は `other`)、アンカーの `type` は
  `character_range` を使っている(`char_range` ではない)。変更時は
  `node_modules/ideamark-cli/src/core/validate.js` 冒頭の定数リストを参照。
- オフセットはすべて JS の UTF-16 コードユニット基準(M1 契約 §5)。
  日本語テキストで実測する場合もこの前提で一貫していれば問題ない。
- mock プロバイダはチャンクから決定的に行を拾うだけなので、閾値調整の
  参考にはならない。閾値の議論は必ず実モデルで。
- `--strict-validate` を付けると validate 失敗で exit 1(CI 向け)。
  既定はドラフト+診断を出して exit 0。
