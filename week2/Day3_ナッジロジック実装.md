# Day3 ナッジロジック実装

## 実装対象
- `week2/prototype/app.js`
- `mock/nudge_rules.json`

## 判定ロジック

### 1) Participation Nudge
- 条件:
  - Top3発言比率 > `dominanceTop3Ratio`（0.70）
  - または未発言者率 > `silenceParticipantRatio`（0.25）
- 表示:
  - 未発言者への発言促進提案

### 2) Diversity Nudge
- 条件:
  - `agree` が一定数あり、`alternative` が不足
  - `alternativeViewMinCount` 未満
- 表示:
  - 代替視点確認提案

### 3) クールダウン
- `nudgeCooldownSec`（90秒）内は再発火抑制

## ログ仕様（実装）
- `speaker_turn_changed`
- `nudge_shown`
- `nudge_accepted`
- `nudge_dismissed`
- `agenda_step_changed`

## UI要件適合
- ナッジは右カラムの `NudgePanel` に表示
- 採用/見送りを即時操作可能
- 理由（閾値超過値）を併記

## 完了判定
- シナリオAでParticipation Nudgeが発火
- シナリオBでDiversity Nudgeが発火
- 採否がログに残る
