# Week5 完了レビュー（統合ダッシュボード）

## 1. 実施概要
- Week2/Week3/Week4の機能を`week5/integrated`へ統合
- 単一URLで会議体験 -> 確定監査 -> 分析レポート -> AI基準確認を完走可能化
- 共通stateとイベント連携で整合性を確保

## 2. 完了判定（E2E）
- 評価対象者選択
- 会議シナリオ実行とナッジ採否
- Finalizeでロック化、例外解除承認、解除後編集
- hash整合表示と監査ログ確認
- KPI再計算と自動レポート生成
- AI判定基準の要約確認

上記導線を単一ページで再現できることを確認。

## 3. 成果物
- `week5/統合ダッシュボード仕様.md`
- `week5/integrated/index.html`
- `week5/integrated/styles.css`
- `week5/integrated/app.js`
- `week5/integrated/README.md`
- `week5/UX最適化レビュー_Big4.md`
- `README.md`（Week5入口追記）
- `実装ロードマップPLAN.md`（Phase5入口追記）

## 4. 受け入れ条件との対応
- 単一URLで理想シナリオ完走: 達成
- 改ざん防止演出（ロック/解除/監査）: 達成
- KPI・レポート・監査連動: 達成
- Big4向け説明性（3秒/1分/5分）: 達成

## 5. 次フェーズ提案
- 公開環境（GitHub Pages/Vercel）へデプロイ
- 閲覧者モード固定（書き換え不可）
- 送付用操作ガイド（1分版/5分版）作成
