# Python Indent Visualizer

**Pythonのインデント構造を視覚的に表示する、初学者に優しいVS Code拡張機能**

Scratchなどのビジュアルプログラミング言語からPythonに移行する学習者を主な対象とした、コード構造可視化ツールです。

![Python Indent Visualizer](./icon.png)

## なぜこの拡張機能が必要か？

**インデントはPython初学者の最大の壁**

ビジュアル言語（Scratchなど）を最初に学んだ人がPythonに移行する際、最も苦労するのがインデントです。視覚的なブロックから見えないスペースへの変化により、スコープの範囲を誤るケースが多発します。

この拡張機能は、Pythonコードの構造をScratchのようなビジュアルブロックとして表示し、初学者が直感的に理解できるようサポートします。

## ✨ 主な機能

### 🎨 カラフルな構造表示

各Pythonステートメントを色分けされたアイコンとブロックで表示：

| ステートメント | アイコン | 色 | 用途 |
|------------|---------|-----|------|
| if/elif/else | 🔀 条件 | オレンジ | 条件分岐 |
| for/while | 🔁 ループ | オレンジ | 繰り返し |
| def | 📦 関数 | 青 | 関数定義 |
| method | ⚙️ メソッド | 水色 | クラス内の関数 |
| class | 🏗️ クラス | ピンク | クラス定義 |
| try/except/finally | 🛡️ 例外 | 赤 | エラー処理 |
| with | 📋 with | 緑 | コンテキスト管理 |
| match/case | 🎯 マッチ | ピンク | パターンマッチング |
| assignment | 📥 代入 | オレンジ | 変数への代入 |
| import | 📦 import | 緑 | モジュールのインポート |

### 🔍 インテリジェントな表示

#### デコレーター対応
```python
@app.route('/api')
@login_required
def api_endpoint():
    pass
```
デコレーターと関数定義を1つのブロックとして表示（すべて青色でハイライト）

#### Import文の特別表示
```python
import os                    # バッジ: os
from math import sin, cos    # バッジ: sin, cos
import numpy as np           # バッジ: np
```
インポートされるモジュールや項目を緑色のバッジで表示。`as`エイリアスがある場合はエイリアスを表示。

#### キーワードの色分け
- **return, yield** → 関数色（青）
- **break, continue** → ループ色（オレンジ）
- **pass, raise, assert** → その他（紫）

#### 代入文のハイライト
```python
result = calculate(x, y)
```
変数名と式を色分けして表示。

### 📐 スマートなグループ化

- **同じスコープの文をグループ化**: 連続する通常の文を1つのブロックにまとめる
- **空行で分離**: 空行で異なるブロックとして分ける
- **括弧内の改行を考慮**: リストや関数引数の改行を正しく処理
- **複数行の関数定義**: 引数が複数行にまたがる場合も正しく表示
- **コメントとdocstringを除外**: `#`コメントと`"""`docstringは表示しない

### 🔗 エディタとの連携

- **スクロール同期**: エディタのスクロールに合わせてビジュアライザーも自動スクロール
- **リアルタイム更新**: コードを編集すると即座に可視化を更新
- **状態の保持**: 非Pythonファイルに切り替えても最後の表示を保持

## 📦 インストール

### VS Code Marketplace（推奨）

1. VS Codeを開く
2. 拡張機能タブ（`Ctrl+Shift+X` / `Cmd+Shift+X`）を開く
3. "Python Indent Visualizer"を検索
4. "インストール"をクリック

または、[こちら](https://marketplace.visualstudio.com/items?itemName=osad-sakana.python-indent-visualizer)から直接インストール

### コマンドラインから

```bash
code --install-extension osad-sakana.python-indent-visualizer
```

## 🚀 使い方

### 1. ビジュアライザーを開く

**方法A: コマンドパレットから**
1. `Ctrl+Shift+P` (Windows/Linux) または `Cmd+Shift+P` (Mac)
2. "Open Python Indent Visualizer"と入力して実行

**方法B: アクティビティバーから**
- Pythonファイルを開くと、自動的にビジュアライザーがアクティブになります

### 2. Pythonコードを書く/開く

任意のPythonファイル（`.py`）を開くと、右ペインに構造が可視化されます。

### 3. リアルタイムで確認

- コードを編集すると即座に可視化が更新されます
- エディタをスクロールすると、ビジュアライザーも連動してスクロールします

## 📸 スクリーンショット

### 基本的な構造の表示
```python
def greet(name):
    if name:
        print(f"Hello, {name}!")
    else:
        print("Hello!")
```

![基本的な表示](./docs/screenshot-sample.png)

### 複雑なネスト構造
```python
class Calculator:
    def calculate(self, x, y):
        try:
            result = x / y
            return result
        except ZeroDivisionError:
            print("エラー: ゼロ除算")
            return None
```

各ブロックが色分けされ、ネスト構造が一目で分かります。

## ⚙️ コマンド

| コマンド | コマンドID | 説明 |
|---------|-----------|------|
| Open Python Indent Visualizer | `python-indent-visualizer.open` | ビジュアライザーを開きます |

## 🎯 対象ユーザー

- **Python初学者**: インデントとスコープの概念を視覚的に理解したい方
- **ビジュアル言語からの移行者**: Scratch、Blockly、MakeCodeなどから移行中の学習者
- **教育者**: Pythonを教える先生や講師
- **コードレビュアー**: コードの構造を素早く把握したい方

## 🔧 技術仕様

### サポートするPython構文

- 制御フロー: if/elif/else, for, while, match/case
- 関数/クラス: def, class, デコレーター(@)
- 例外処理: try/except/finally
- コンテキスト管理: with
- モジュール: import, from...import
- 特殊文: return, yield, break, continue, pass, raise, assert

### インデント検出

- タブを4スペースに自動変換
- インデントレベルからネスト構造を構築
- 括弧（`[]`, `()`, `{}`）の開閉を追跡して複数行ステートメントを処理

### 表示の最適化

- インデント幅を2スペースに圧縮（読みやすさ向上）
- VS Codeのテーマに適応
- セマンティックカラーでステートメントタイプを区別

## 🐛 既知の制限

- Python 3.10以降の構文（match/case）に対応していますが、一部の高度な構文には未対応の場合があります
- 非常に長いファイル（1000行以上）では表示に時間がかかることがあります

## 🤝 フィードバック・貢献

### バグ報告・機能要望

[GitHub Issues](https://github.com/osad-sakana/python-indent-visualizer/issues)でお知らせください。

### 開発に参加

プルリクエストを歓迎します！詳細は[CONTRIBUTING.md](https://github.com/osad-sakana/python-indent-visualizer/blob/main/CONTRIBUTING.md)をご覧ください。

## 📄 ライセンス

MIT License - 詳細は[LICENSE](LICENSE)をご覧ください。

## 🙏 謝辞

- アイコンはDALL-Eで作成しました
- Scratchの視覚的デザインにインスパイアされています

## 🌟 評価・レビュー

この拡張機能が役に立った場合は、[Marketplace](https://marketplace.visualstudio.com/items?itemName=osad-sakana.python-indent-visualizer)で⭐評価とレビューをお願いします！
