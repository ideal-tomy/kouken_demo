# Day4 監査パネルと差分トレース実装

## 実装対象
- `week3/prototype/index.html`
- `week3/prototype/app.js`

## 実装内容
- `recordHash` と `expectedHash` の表示
- 整合性ステータス（OK/Warning）
- 不一致時の警告バナー表示（改ざん疑義演出）
- 監査サマリ
  - 変更履歴件数
  - 最終更新者
- 監査詳細
  - before/after差分（スナップショット）
  - 変更理由

## 完了判定
- 監査ログ表示トグルで履歴を確認できる
- 不整合時に警告バナーが表示される
