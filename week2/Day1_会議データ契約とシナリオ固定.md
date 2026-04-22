# Day1 会議データ契約とシナリオ固定（Phase2）

## 目的
- 会議ライブ体験の再現性を担保するため、入力データ契約とナッジ閾値を固定する。

## 契約対象ファイル
- `mock/meeting_transcript.json`
- `mock/nudge_rules.json`

## `meeting_transcript.json` 契約

### ルート
- `meta`
- `scenarios[]`

### `scenarios[]` 必須
- `scenarioId`
- `name`
- `intent`（発言偏在型 / 異論不足型）
- `agenda[]`
- `utterances[]`

### `agenda[]` 必須
- `stepId`
- `title`
- `timeboxMin`

### `utterances[]` 必須
- `seq`
- `speakerId`
- `speakerName`
- `speakerRole`
- `startedAtSec`
- `durationSec`
- `agendaStepId`
- `stance`（agree / concern / alternative / question）
- `content`

## ナッジ閾値（固定）
- `dominanceTop3Ratio`: 0.70
- `silenceParticipantRatio`: 0.25
- `alternativeViewMinCount`: 1
- `nudgeCooldownSec`: 90
- `maxNudgesPerAgenda`: 2

## シナリオ固定
- シナリオA: 発言偏在型（上位3名で70%超）
- シナリオB: 異論不足型（agree偏重、alternative不足）

## Day1完了判定
- 上記契約でデータファイルが作成され、UI実装側が読み込める状態
