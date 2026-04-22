# Week3完了レビュー（Phase3）

## 1. 実施サマリ
- 確定/監査データ契約を固定
- Finalize入力と確定ステータス表示を実装
- 確定後ロックと例外解除フローを実装
- 監査パネル（hash照合、履歴、差分）を実装

## 2. Exit Criteria達成確認

### EC-01
確定後、通常操作で編集不可  
-> 達成（read-only制御）

### EC-02
例外解除フローでのみ編集可能  
-> 達成（申請・承認後のみ限定編集）

### EC-03
変更前後差分が監査ログに残る  
-> 達成（beforeSnapshot/afterSnapshot 記録）

### EC-04
recordHashと整合性ステータス表示  
-> 達成（expectedHash比較、Warning表示）

### EC-05
原則変更不可・例外監査対象を説明可能  
-> 達成（UI文言・監査パネルで明示）

## 3. 生成成果物
- `week3/Day1_確定監査データ契約.md`
- `week3/Day2_Finalize画面実装.md`
- `week3/Day3_ロック解除フロー実装.md`
- `week3/Day4_監査パネル実装.md`
- `mock/final_decisions.json`
- `mock/audit_log.json`
- `week3/prototype/index.html`
- `week3/prototype/styles.css`
- `week3/prototype/app.js`
- `week3/prototype/README.md`

## 4. 監査観点レビュー
- 誰が変更したか: `actorId` で追跡可能
- いつ変更したか: `eventAt` で追跡可能
- なぜ変更したか: `reason` で追跡可能
- 何が変わったか: `beforeSnapshot` / `afterSnapshot` で追跡可能

## 5. 既知課題
- ハッシュはデモ簡易実装（本番では暗号学的ハッシュへ置換）
- 解除承認は疑似承認（本番では権限連携を追加）
