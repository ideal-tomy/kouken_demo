# AI Equity System Demo (Week1-Week5)

Big4向け提案デモとして、評価会議の公平性・説明可能性・監査性を段階的に体験できる静的プロトタイプです。

## デモの入口（推奨）
- 最新版（統合ダッシュボード）:
  - `week5/integrated/index.html`
- 参考（Week4単体）:
  - `week4/prototype/index.html`

## ストーリー導線（Week1 -> Week5）
- Week1: 事前評価（Top / P0 / Evidence）
  - [week1/prototype/README.md](./week1/prototype/README.md)
- Week2: 評価会議ライブ（ナッジ・9-Box）
  - [week2/prototype/README.md](./week2/prototype/README.md)
- Week3: 確定ロック・監査
  - [week3/prototype/README.md](./week3/prototype/README.md)
- Week4: 会議後AI分析・自動レポート
  - [week4/prototype/README.md](./week4/prototype/README.md)
- Week5: 統合ダッシュボード（会議〜監査〜レポート一体）
  - [week5/integrated/README.md](./week5/integrated/README.md)

## ローカル起動（静的配信確認）
`file://` 直開きでは `fetch` 制約が出るため、ローカルサーバーで起動してください。

```powershell
cd "c:\Users\ryoji\demo\kouken_demo"
python -m http.server 8000
```

起動後:
- Week1: `http://localhost:8000/week1/prototype/index.html`
- Week2: `http://localhost:8000/week2/prototype/index.html`
- Week3: `http://localhost:8000/week3/prototype/index.html`
- Week4: `http://localhost:8000/week4/prototype/index.html`
- Week5: `http://localhost:8000/week5/integrated/index.html`

## 主要データ
- `mock/ai_first_pass.json`
- `mock/candidate_index.json`
- `mock/evidence_catalog.json`
- `mock/meeting_transcript.json`
- `mock/nudge_rules.json`
- `mock/final_decisions.json`
- `mock/audit_log.json`
- `mock/post_meeting_analytics.json`
- `mock/report_templates.json`

## 既知の制約
- 本デモはモックデータ駆動です（本番DB連携は未実装）。
- レポートは画面内自動生成演出で、PDFファイル出力は未実装です。
