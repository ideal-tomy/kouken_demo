# Week1 Prototype

## 導線
- 全体入口: [../../README.md](../../README.md)
- 次のステップ（Week2）: [../../week2/prototype/README.md](../../week2/prototype/README.md)

## 対象
- TopDashboard
- P0Detail
- EvidenceExplorer

## 起動方法
ローカルサーバーで起動して確認する（`file://` 直開きだと fetch 制約が出る場合がある）。

例（PowerShell）:

```powershell
cd "c:\Users\ryoji\demo\kouken_demo"
python -m http.server 8000
```

ブラウザで以下へアクセス:

- `http://localhost:8000/week1/prototype/index.html`

## 参照データ
- `mock/candidate_index.json`
- `mock/ai_first_pass.json`
- `mock/evidence_catalog.json`

## 実装済み要件（Week1）
- Top -> P0 -> Evidence の遷移
- 判定/信頼度/リスクの表示
- AI判定テンプレート表示（強み2、懸念2、要確認1）
- 根拠IDドリルダウンと鮮度表示
- 「AIは最終決裁しない」表示
