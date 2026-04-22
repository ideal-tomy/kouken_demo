# Day1 分析データ契約とKPI算出定義固定

## 目的
- 会議後ダッシュボードと自動レポートの計算根拠を固定し、説明可能性を担保する。

## 対象ファイル
- `mock/post_meeting_analytics.json`
- `mock/report_templates.json`

## KPI定義（固定）
- Participation Equity
  - `100 - max(0, (top3TalkRatio * 100 - 50))`
- Nudge Effectiveness
  - `acceptedNudgesWithImprovement / acceptedNudges`
- Explainability
  - `decisionsWithEvidence / totalDecisions`
- Collaboration Quality
  - `weighted(alternativeViews, unresolvedIssuesDown, participationImprovement)`
- Calibration Gap
  - `100 - normalized(avgAbsGapAiVsHuman)`

## 監査整合性指標
- `hashIntegrityRate`（hash OK率）
- `exceptionUnlockRate`（例外解除率）
- `postFinalizeEditRate`（確定後編集率）

## データ契約
- `post_meeting_analytics.json`
  - `kpiCards[]`
  - `charts`
  - `insights`
  - `drilldownRefs`
- `report_templates.json`
  - `executiveSummaryTemplate`
  - `kpiSummaryTemplate`
  - `governanceTemplate`
  - `actionsTemplate`

## 完了条件
- KPI算出式が文書化され、モックJSONに反映済み
