# Week1完了レビュー（Phase0-1）

## 1. 実施サマリ

Week1計画（Phase0-1）に基づき、会議前導線の実装を完了した。

- Phase0: 仕様凍結、データ契約、UIフロー固定
- Phase1: TopDashboard / P0Detail / EvidenceExplorer の実装

## 2. Exit Criteria達成確認

### EC-01
30〜60秒で1名の評価全体像を説明できる  
-> 達成（Topカード -> P0詳細で即時把握）

### EC-02
AI判定理由がテンプレートで表示される  
-> 達成（強み2・懸念2・要確認1をP0で表示）

### EC-03
根拠IDに到達でき、判定因果が説明できる  
-> 達成（P0 -> EvidenceExplorer で根拠参照）

### EC-04
「AIは支援、最終決裁しない」がUIで明示  
-> 達成（ヘッダー/P0で表示）

### EC-05
次週へ渡せる導線安定  
-> 達成（Top -> P0 -> Evidence の最小動線確立）

## 3. 生成成果物

- `week1/Day1_仕様凍結.md`
- `week1/DataContract_ai_first_pass.md`
- `week1/UIFlow_Week1.md`
- `week1/TaskBreakdown_Week1.md`
- `week1/Day2_モック整合チェック.md`
- `mock/candidate_index.json`
- `mock/evidence_catalog.json`
- `week1/prototype/index.html`
- `week1/prototype/styles.css`
- `week1/prototype/app.js`
- `week1/prototype/README.md`

## 4. Week2（Phase2）への引き継ぎ

### 4.1 固定入力（会議ライブに渡す）
- `candidateId`
- `recommendedOutcome`
- `confidence`
- `riskFlags`
- `evidenceRefs`

### 4.2 追加実装対象
- 会議ライブ画面（発言比率、未発言者、進行バー）
- ナッジカード表示と採否ログ
- 9-Boxの会議中表示更新

### 4.3 必須イベントログ
- `nudge_shown`
- `nudge_accepted`
- `speaker_turn_changed`
- `agenda_step_changed`

## 5. 既知課題（Week2着手時に対応）

- 円グラフは現在「簡易表示」のため、実チャートコンポーネントに置換する
- EvidenceのsourceTypeタブは絞込済みだが、ソート/検索は未対応
- KPI5種の会議後表示はPhase4対象のため未実装
