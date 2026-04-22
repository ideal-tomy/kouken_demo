# Week3 Prototype

## 導線
- 全体入口: [../../README.md](../../README.md)
- 前のステップ（Week2）: [../../week2/prototype/README.md](../../week2/prototype/README.md)
- 次のステップ（Week4）: [../../week4/prototype/README.md](../../week4/prototype/README.md)

## 対象
- Finalize画面（最終判断入力）
- 確定後ロック
- 例外解除フロー
- 監査パネル（hash/履歴/差分）

## 起動方法
```powershell
cd "c:\Users\ryoji\demo\kouken_demo"
python -m http.server 8000
```

ブラウザ:
- `http://localhost:8000/week3/prototype/index.html`

## 参照データ
- `mock/final_decisions.json`
- `mock/audit_log.json`

## 実装イベント
- `finalize`
- `unlock_request`
- `unlock_approved`
- `edit_after_unlock`
