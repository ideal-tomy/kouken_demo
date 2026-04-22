# Week3引き継ぎ仕様（Phase3: 確定/監査）

## 1. 引き継ぎ目的
Week2で生成された会議データを、Week3の「最終確定・改ざん防止・監査演出」へ接続する。

## 2. 引き継ぎデータ

### 必須
- `finalizedCandidateSet`（評価対象者集合）
- `meetingEventLog`（会議イベント時系列）
- `nudgeDecisionLog`（ナッジ採否）
- `nineBoxGapLog`（AI/Human差分と理由）

### 推奨
- `scenarioId`
- `agendaCompletionState`
- `speakerDurationSummary`

## 3. Week3で実装するイベント
- `finalize`
- `unlock_request`
- `unlock_approved`
- `edit_after_unlock`

## 4. データ接続ポイント（Week2 -> Week3）
- `meetingEventLog` を確定画面の監査履歴初期値に投入
- `nudgeDecisionLog` を会議妥当性分析の入力に利用
- `nineBoxGapLog` を最終判断差分説明に利用

## 5. 監査要件の前提
- Week3で `recordHash` 付与
- 確定後は通常編集不可
- 例外変更は解除フロー経由のみ
