# Week2 Prototype

## 導線
- 全体入口: [../../README.md](../../README.md)
- 前のステップ（Week1）: [../../week1/prototype/README.md](../../week1/prototype/README.md)
- 次のステップ（Week3）: [../../week3/prototype/README.md](../../week3/prototype/README.md)

## 対象
- Meeting Live（画面B相当）
- Nudge Panel（採用/見送り）
- 9-Box会議中更新

## 起動方法
```powershell
cd "c:\Users\ryoji\demo\kouken_demo"
python -m http.server 8000
```

ブラウザ:
- `http://localhost:8000/week2/prototype/index.html`

## 使用データ
- `mock/candidate_index.json`
- `mock/ai_first_pass.json`
- `mock/evidence_catalog.json`
- `mock/meeting_transcript.json`
- `mock/nudge_rules.json`

## 確認シナリオ
- A: 発言偏在型（Participation Nudge）
- B: 異論不足型（Diversity Nudge）

## ログイベント
- `agenda_step_changed`
- `speaker_turn_changed`
- `nudge_shown`
- `nudge_accepted`
- `nudge_dismissed`
- `ninebox_gap_saved`
