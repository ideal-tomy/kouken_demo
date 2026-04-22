# Data Contract: `mock/ai_first_pass.json`（Week1）

## 用途
- Top/P0/Evidenceで表示する最小契約を固定する。

## ルート構造
- `meta`: 生成情報
- `records`: 候補者ごとのAI一次判定配列

## `records[]` 必須フィールド
- `candidateId` (string)
- `recommendedOutcome` ("Promote" | "Hold" | "Develop")
- `confidence` ("High" | "Medium" | "Low")
- `confidenceScore` (number, 0.0-1.0)
- `summary` (string)
- `competencyScores` (object, 9軸)
- `nineBoxAI.performance` (number, 0-100)
- `nineBoxAI.potential` (number, 0-100)
- `evidenceRefs` (string[])
- `riskFlags` (string[])
- `openQuestionsForCalibration` (string[])
- `explainTrace` (string[])

## `competencyScores` 必須キー
- `Leadership`
- `BusinessAcumen`
- `TechnicalDeliversQuality`
- `StrategicImpact`
- `CollaborationRelationships`
- `GlobalAcumen`
- `PeopleDevelopment`
- `IntegrityProfessionalJudgment`
- `InnovationResilience`

## 表示マッピング（Week1）
- Topカード:
  - `candidateId`
  - `recommendedOutcome`
  - `confidence`
  - `riskFlags[0..2]`
- P0詳細:
  - `summary`
  - `competencyScores`
  - `nineBoxAI`
  - `openQuestionsForCalibration`
- Evidence Explorer:
  - `evidenceRefs`
  - `explainTrace`

## バリデーションルール
- `evidenceRefs.length >= 3`
- `explainTrace.length >= 3`
- `confidenceScore` と `confidence` のレンジ整合
  - High: >= 0.75
  - Medium: 0.55-0.74
  - Low: < 0.55
