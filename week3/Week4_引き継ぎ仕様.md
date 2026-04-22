# Week4引き継ぎ仕様（Phase4: 会議後AI分析）

## 1. 引き継ぎ目的
Week3で確定・監査されたデータを、Week4の会議後分析へ接続する。

## 2. 引き継ぎデータ
- `finalizedDecisions`
  - 最終判定、差分理由、文脈タグ、確定情報
- `auditLog`
  - 変更履歴、承認履歴、差分スナップショット
- `unlockHistory`
  - 解除申請/承認回数、理由分類
- `hashCheckResults`
  - 整合性照合結果（OK/Warning）

## 3. Week4分析接続観点
- 整合性スコア
  - 監査整合率、例外変更率
- バイアス警告採否の結果
  - 会議中ナッジ採否との相関
- 参加者行動評価との相関
  - 発言エクイティ改善との関係

## 4. 必須イベント継続
- `finalize`
- `unlock_request`
- `unlock_approved`
- `edit_after_unlock`
- `hash_check_ok` / `hash_check_warning`
