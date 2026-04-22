# Week4 Prototype

## 導線
- 全体入口: [../../README.md](../../README.md)
- 前のステップ（Week3）: [../../week3/prototype/README.md](../../week3/prototype/README.md)

## 対象
- 会議後AI分析ダッシュボード（画面D）
- KPI 5種可視化
- 根拠ドリルダウン
- 自動レポート生成

## 起動方法
```powershell
cd "c:\Users\ryoji\demo\kouken_demo"
python -m http.server 8000
```

ブラウザ:
- `http://localhost:8000/week4/prototype/index.html`

## 参照データ
- `mock/post_meeting_analytics.json`
- `mock/report_templates.json`

## 操作
1. KPIカードをクリックして根拠参照を確認
2. 「自動レポート生成」を押して要約レポートを生成
3. 「レポート表示切替」で比較確認
