# Day1 確定/監査データ契約固定

## 目的
- Week3のFinalize/Lock/Audit実装で使うデータ契約を固定する。

## 対象ファイル
- `mock/final_decisions.json`
- `mock/audit_log.json`

## `final_decisions.json` 契約

### ルート
- `meta`
- `records[]`

### `records[]` 必須
- `candidateId`
- `aiOutcome`
- `humanOutcome`
- `deltaReason`
- `contextTags`（配列）
- `deciders`（配列）
- `finalizedFlag`（bool）
- `finalizedAt`（datetime or null）
- `finalizedBy`（string or null）
- `lockVersion`（int）
- `recordHash`（string）
- `unlockRequest`（object or null）

## `audit_log.json` 契約

### ルート
- `meta`
- `events[]`

### `events[]` 必須
- `eventType`（`finalize` / `unlock_request` / `unlock_approved` / `edit_after_unlock`）
- `actorId`
- `eventAt`
- `candidateId`
- `reason`
- `beforeSnapshot`
- `afterSnapshot`

## recordHashルール（デモ簡易）
- 入力:
  - `candidateId`
  - `humanOutcome`
  - `deltaReason`
  - `contextTags`（連結）
  - `lockVersion`
- 生成:
  - 文字列連結の簡易ハッシュ（`simpleHash`）
- 照合:
  - 画面表示時に再計算して一致/不一致を表示

## Day1完了条件
- 契約ファイル作成済み
- 初期レコードでハッシュが付与済み
