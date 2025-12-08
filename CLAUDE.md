# CLAUDE.md - 開発ガイド

このドキュメントは、Claude CodeまたはAI支援ツールを使用してこのプロジェクトを開発・保守する際のガイドラインです。

## プロジェクト概要

**Python Indent Visualizer**は、Pythonのインデント構造を視覚的に表示するVS Code拡張機能です。Scratchなどのビジュアルプログラミング言語からPythonに移行する初学者を主な対象としています。

## アーキテクチャ

### コア構成

```
src/
├── extension.ts       # VS Code拡張機能のエントリーポイント
├── indentTree.ts      # Pythonコードの解析とツリー構築
└── webviewContent.ts  # ビジュアライザーのUI（HTML/CSS/JS）
```

### データフロー

1. **ソースコード取得** (`extension.ts`)
   - アクティブなPythonファイルのテキストを取得
   - ファイル変更・エディタ切り替えイベントをリッスン

2. **解析とツリー構築** (`indentTree.ts`)
   - インデントレベルを検出（タブは4スペースに変換）
   - ステートメントタイプを判定（if/for/def/classなど）
   - 括弧の開閉を追跡して複数行ステートメントを処理
   - ツリー構造（IndentNode[]）を構築

3. **可視化** (`webviewContent.ts`)
   - Webviewでツリーをレンダリング
   - カラーアイコンとネストブロックで表示
   - スクロール同期を処理

## 重要な実装詳細

### 1. インデント検出とグループ化

**基本原則:**
- 同じインデントレベルの連続する通常の文は1つのブロックにグループ化
- 空行で別のブロックに分離
- 括弧（`[]`, `()`, `{}`）が閉じるまでは同じブロック
- コメント行（`#`で始まる行）は除外

**実装のポイント:**
```typescript
// indentTree.ts内
- otherLinesBuffer: 通常の文を蓄積
- unclosedBrackets: 括弧の開閉状態を追跡
- flushOtherLines(): バッファをフラッシュしてノード作成
```

### 2. 複数行の構造的ステートメント

**課題:**
```python
def function_name(
    arg1,
    arg2,
):
```
のような複数行にわたる関数定義を正しく処理する必要がある。

**解決策:**
```typescript
// pendingStructuralNode: 括弧が閉じるまで保留
// pendingStructuralBrackets: 括弧カウント
// flushPendingStructural(): 括弧が閉じたら完成
```

### 3. メソッドと関数の区別

クラス内の`def`は「メソッド」として扱う：
```typescript
// スタックを遡ってクラスノードを探す
if (statementType === 'def') {
  for (let j = stack.length - 1; j >= 0; j--) {
    if (stack[j].statementType === 'class') {
      statementType = 'method';
      break;
    }
  }
}
```

### 4. スクロール同期

**実装:**
- VS Code: `onDidChangeTextEditorVisibleRanges`イベントをリッスン
- 可視範囲（firstVisibleLine, lastVisibleLine）をWebviewに送信
- Webview: 該当ブロックまでスムーズスクロール

### 5. 状態の保持

非Pythonファイルに切り替えても最後のPythonファイルを表示：
```typescript
let lastPythonDocument: vscode.TextDocument | undefined;
// Pythonファイルを開くたびに保存
// 非Pythonファイルでは最後のドキュメントを使用
```

## 開発時の注意事項

### コーディング規約

1. **TypeScriptの厳格性**
   - すべての関数に型注釈を付ける
   - `any`型の使用を避ける
   - 未使用変数は削除する

2. **パフォーマンス**
   - ツリー更新は300msのデバウンス処理
   - スクロール同期は`smooth`アニメーション使用
   - 大きなファイルでも快適に動作すること

3. **セキュリティ**
   - WebviewのコンテンツはすべてエスケープHTML処理
   - CSPヘッダーを適切に設定

### テストケース

開発・修正時には以下のケースをテスト：

1. **基本構造**
   - シンプルなif/for/while
   - ネストした構造
   - クラスとメソッド

2. **エッジケース**
   - 空のファイル
   - コメントのみのファイル
   - 複数行の関数定義
   - 括弧内の改行（リスト、辞書、引数）
   - 複数レベルのネスト解消

3. **UI/UX**
   - ファイル切り替え時の動作
   - スクロール同期
   - リアルタイム更新

## よくある問題と解決策

### 問題1: インデントがずれる

**原因:** 複数レベルのネストを抜ける際のスタック処理
**解決:** `flushOtherLines()`内でスタックを適切にポップ

### 問題2: 括弧内の改行が別ブロックになる

**原因:** 括弧の開閉追跡が不十分
**解決:** `countUnclosedBrackets()`で文字列とコメント内の括弧を除外

### 問題3: メソッドが関数として表示される

**原因:** クラス判定ロジックの不備
**解決:** スタックを遡ってクラスノードを探す

## 拡張・改善のアイデア

### 実装済み機能
- ✅ カラーアイコン
- ✅ キーワードハイライト
- ✅ スクロール同期
- ✅ 複数行ステートメント対応
- ✅ メソッド/関数の区別
- ✅ 状態の保持

### 将来的な機能候補
- 🔲 折りたたみ可能なブロック
- 🔲 ミニマップ表示
- 🔲 エラー行のハイライト
- 🔲 docstringの表示
- 🔲 型ヒントの表示
- 🔲 複雑度メトリクスの表示
- 🔲 他の言語（JavaScript、C++など）のサポート

## ビルドとデプロイ

### 開発時
```bash
npm run compile  # TypeScriptをコンパイル
npm run watch    # ファイル変更を監視
```

### デバッグ
- VS Codeで開いて`F5`を押す
- Extension Development Hostが起動
- ブレークポイントとデバッグコンソールを使用可能

### 公開前
```bash
npm run vscode:prepublish
```

## コードスタイル

### ファイル命名
- `camelCase.ts` - TypeScriptファイル
- 明確で説明的な名前を使用

### コメント
- 関数にはJSDocコメントを付ける
- 複雑なロジックには実装コメントを追加
- 日本語コメントも可（対象ユーザーに合わせて）

### インポート
```typescript
import * as vscode from 'vscode';  // 外部ライブラリ
import { buildIndentTree } from './indentTree';  // 内部モジュール
```

## デバッグのヒント

### ツリー構造の確認
```typescript
console.log(JSON.stringify(tree, null, 2));
```

### Webviewデバッグ
- Extension Development Hostで`Cmd+Option+I`を押す
- Developer Toolsが開く
- Consoleでログを確認

### イベント追跡
```typescript
console.log('Event:', event.type, event.data);
```
