# Day2 モック整合チェック結果

## 対象ファイル
- `mock/ai_first_pass.json`
- `mock/candidate_index.json`
- `mock/evidence_catalog.json`

## チェック項目

### 1) 評価対象者ID整合
- `ai_first_pass.records[].candidateId` と `candidate_index.candidates[].candidateId` が一致
- 結果: OK（P01-P10 10名）

### 2) 判定表示整合
- Top表示の `recommendedOutcome`, `confidence` が `ai_first_pass` と整合
- 結果: OK

### 3) 根拠参照整合
- `ai_first_pass.records[].evidenceRefs[]` が `evidence_catalog.evidence[].evidenceId` で解決可能
- 結果: OK（全40件）

### 4) Explainability最小要件
- 1評価対象者あたり `evidenceRefs >= 3`
- 1評価対象者あたり `explainTrace >= 3`
- 結果: OK

## 残課題（Day3へ）
- フィルタ対象に `riskLevel` を採用（Top画面）
- Evidence Explorerで `sourceType` タブを実装（360/KPI/Meeting/Artifact）
- P0画面に根拠鮮度（`freshness`）表示を追加
