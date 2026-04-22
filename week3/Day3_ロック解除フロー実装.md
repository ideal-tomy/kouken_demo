# Day3 ロック状態と例外解除フロー実装

## 実装対象
- `week3/prototype/index.html`
- `week3/prototype/app.js`

## 実装内容
- 確定後の通常編集禁止（read-only）
- 例外解除申請フォーム
  - 解除理由（必須）
  - 影響範囲（必須）
  - 承認者（必須）
- 承認後の限定編集
- 監査イベント記録
  - `unlock_request`（UI起点）
  - `unlock_approved`
  - `edit_after_unlock`

## 完了判定
- 未承認では編集不可
- 承認後のみ編集可能
- 編集履歴が監査ログへ記録される
