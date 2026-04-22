# Day2 Finalize画面実装

## 実装対象
- `week3/prototype/index.html`
- `week3/prototype/app.js`

## 実装内容
- Human最終判断入力UI
- 差分理由（必須）・文脈タグ・決定者入力
- Finalize処理
  - `finalizedFlag = true`
  - `finalizedAt`, `finalizedBy` 更新
  - `lockVersion` インクリメント
  - `recordHash` 再計算
- `finalize` イベントを監査ログへ記録

## 完了判定
- 必須入力不足時は確定不可
- Finalize後にステータス（時刻/決定者）表示
