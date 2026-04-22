# Week5 Integrated Dashboard

## 目的
- Week2（会議体験）/ Week3（確定監査）/ Week4（分析レポート）を単一URLで体験する統合デモ。

## 起動方法
```powershell
cd "c:\Users\ryoji\demo\kouken_demo"
python -m http.server 8000
```

ブラウザ:
- `http://localhost:8000/week5/integrated/index.html`

## 体験シナリオ（推奨）
1. 会議ライブでシナリオ実行し、ナッジ採否を確認
2. 確定・監査タブで Finalize、ロック、例外解除、監査ログを確認
3. 分析・レポートタブでKPIと自動レポートを確認
4. AI判定基準タブで説明可能性とガードレールを確認

## 主要データ
- `mock/candidate_index.json`
- `mock/ai_first_pass.json`
- `mock/meeting_transcript.json`
- `mock/nudge_rules.json`
- `mock/final_decisions.json`
- `mock/audit_log.json`
- `mock/post_meeting_analytics.json`
- `mock/report_templates.json`
- `AI判定基準_仮.md`
