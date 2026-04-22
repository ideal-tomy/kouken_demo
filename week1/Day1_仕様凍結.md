# Day1 仕様凍結（Phase0）

## 目的
- Week1実装のブレを防ぐため、KPI・AI役割・画面遷移・データ契約を固定する。

## 凍結事項

### 1) KPI（5種）
- Participation Equity
- Nudge Effectiveness
- Explainability
- Collaboration Quality
- Calibration Gap

### 2) AI役割境界
- AIは意思決定支援のみを行う
- 最終決裁は人間が行う
- AI判定は必ず根拠IDと信頼度を伴う

### 3) 画面遷移（Week1対象）
```text
TopDashboard -> P0Detail -> EvidenceExplorer
```

### 4) 正本ドキュメント
- `要件定義.md`
- `技術要件.md`
- `UIUX要件.md`
- `詳細評価ページ要件.md`
- `AI判定基準_仮.md`

## Must/Should/Could（Week1）

### Must
- Top一覧からP0詳細に遷移できる
- P0でAI判定テンプレート（強み2・懸念2・要確認1）を表示
- Evidence Explorerで根拠IDを確認できる
- 「AIは最終決裁しない」を画面表示

### Should
- 部門/判定/リスクの簡易フィルタ
- 根拠鮮度表示
- KPIミニ表示（会議前の参考）

### Could
- ダーク/ライト切替
- ソート保存

## 出力物
- `week1\DataContract_ai_first_pass.md`
- `week1\UIFlow_Week1.md`
- `week1\TaskBreakdown_Week1.md`
