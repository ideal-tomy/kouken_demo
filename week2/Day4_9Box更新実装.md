# Day4 9-Box会議中更新実装

## 実装対象
- `week2/prototype/app.js`
- `week2/prototype/index.html`

## 実装内容

### 1) AI位置表示
- `ai_first_pass.json` の `nineBoxAI` を初期表示

### 2) Human位置の暫定更新
- 入力項目:
  - `human-performance`
  - `human-potential`
- 入力時に乖離量をリアルタイム表示

### 3) 乖離理由記録
- `gap-reason` を必須入力
- 保存時に `ninebox_gap_saved` イベントとして記録

### 4) 会議説明性
- 「AI位置 vs Human位置」の並列表示
- 乖離量を数値表示し、補正の説明責任を明確化

## 完了判定
- Human値変更で乖離量が更新される
- 理由未入力では保存不可
- 保存後にイベントログへ記録される
