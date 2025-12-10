import * as vscode from 'vscode';

/**
 * Generates the HTML content for the webview panel
 * @param webview - The VSCode webview instance
 * @param extensionUri - The URI of the extension
 * @returns HTML string for the webview
 */
export function getWebviewContent(_webview: vscode.Webview, _extensionUri: vscode.Uri): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
  <title>Python Indent Visualizer</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 16px;
      margin: 0;
    }

    #root {
      max-width: 100%;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
    }

    .block {
      border: 2px solid;
      border-radius: 8px;
      padding: 10px 12px;
      margin: 6px 0;
      position: relative;
      background-color: var(--vscode-editor-background);
    }

    .block-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .statement-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 28px;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
      gap: 5px;
      white-space: nowrap;
    }

    .line-text {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      user-select: text;
      white-space: pre-wrap;
      word-break: break-word;
      flex: 1;
    }

    /* Statement type colors and icons - Scratch-inspired */
    .statement-icon.if,
    .statement-icon.elif,
    .statement-icon.else {
      background-color: #FFB84D;
      color: white;
    }

    .statement-icon.for,
    .statement-icon.while {
      background-color: #FFAB19;
      color: white;
    }

    .statement-icon.def {
      background-color: #5CB1D6;
      color: white;
    }

    .statement-icon.method {
      background-color: #4CBFE6;
      color: white;
    }

    .statement-icon.class {
      background-color: #CF63CF;
      color: white;
    }

    .statement-icon.try,
    .statement-icon.except,
    .statement-icon.finally {
      background-color: #FF6680;
      color: white;
    }

    .statement-icon.with {
      background-color: #59C059;
      color: white;
    }

    .statement-icon.match,
    .statement-icon.case {
      background-color: #D65CD6;
      color: white;
    }

    .statement-icon.other {
      background-color: #9966FF;
      color: white;
    }

    /* Keyword highlighting */
    .keyword {
      font-weight: bold;
    }

    .keyword-if,
    .keyword-elif,
    .keyword-else {
      color: #FFB84D;
    }

    .keyword-for,
    .keyword-while {
      color: #FFAB19;
    }

    .keyword-def {
      color: #5CB1D6;
    }

    .keyword-method {
      color: #4CBFE6;
    }

    .keyword-class {
      color: #CF63CF;
    }

    .keyword-try,
    .keyword-except,
    .keyword-finally {
      color: #FF6680;
    }

    .keyword-with {
      color: #59C059;
    }

    .keyword-match,
    .keyword-case {
      color: #D65CD6;
    }

    /* Border colors for blocks by statement type */
    .block[data-statement="if"],
    .block[data-statement="elif"],
    .block[data-statement="else"] {
      border-color: #FFB84D;
      background-color: rgba(255, 184, 77, 0.08);
    }

    .block[data-statement="for"],
    .block[data-statement="while"] {
      border-color: #FFAB19;
      background-color: rgba(255, 171, 25, 0.08);
    }

    .block[data-statement="def"] {
      border-color: #5CB1D6;
      background-color: rgba(92, 177, 214, 0.08);
    }

    .block[data-statement="method"] {
      border-color: #4CBFE6;
      background-color: rgba(76, 191, 230, 0.08);
    }

    .block[data-statement="class"] {
      border-color: #CF63CF;
      background-color: rgba(207, 99, 207, 0.08);
    }

    .block[data-statement="try"],
    .block[data-statement="except"],
    .block[data-statement="finally"] {
      border-color: #FF6680;
      background-color: rgba(255, 102, 128, 0.08);
    }

    .block[data-statement="with"] {
      border-color: #59C059;
      background-color: rgba(89, 192, 89, 0.08);
    }

    .block[data-statement="match"],
    .block[data-statement="case"] {
      border-color: #D65CD6;
      background-color: rgba(214, 92, 214, 0.08);
    }

    .block {
      position: relative;
    }

    /* Style for 'other' type blocks (grouped statements) */
    .block-other {
      border-color: #9966FF;
      background-color: rgba(153, 102, 255, 0.08);
    }

    .block-other .line-text {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="empty-state">Pythonファイルを開いてインデント構造を可視化します</div>
  </div>

  <script>
    (function() {
      const vscode = acquireVsCodeApi();

      /**
       * Escapes HTML to prevent XSS
       */
      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      /**
       * Gets icon text for a statement type
       */
      function getStatementIcon(type) {
        const icons = {
          'if': '🔀 条件',
          'elif': '🔀 条件',
          'else': '🔀 条件',
          'for': '🔁 ループ',
          'while': '🔄 ループ',
          'def': '📦 関数',
          'method': '⚙️ メソッド',
          'class': '🏗️ クラス',
          'try': '🛡️ 例外',
          'except': '⚠️ 例外',
          'finally': '✅ 例外',
          'with': '📋 with',
          'match': '🎯 マッチ',
          'case': '🎯 マッチ',
          'other': '📝'
        };
        return icons[type] || '📝';
      }

      /**
       * Highlights keywords in the code text based on statement type
       */
      function highlightKeyword(text, statementType) {
        const keywordMap = {
          'if': 'if',
          'elif': 'elif',
          'else': 'else',
          'for': 'for',
          'while': 'while',
          'def': 'def',
          'method': 'def',
          'class': 'class',
          'try': 'try',
          'except': 'except',
          'finally': 'finally',
          'with': 'with',
          'match': 'match',
          'case': 'case'
        };

        const keyword = keywordMap[statementType];
        if (!keyword) {
          return escapeHtml(text);
        }

        // Find the keyword at the start of the statement (after whitespace)
        const pattern = new RegExp(\`^(\\\\s*)(\\\\b\${keyword}\\\\b)(.*)\$\`);
        const match = text.match(pattern);

        if (match) {
          const [, leadingSpace, keywordText, rest] = match;
          const keywordClass = statementType === 'method' ? 'keyword-method' : \`keyword-\${statementType}\`;
          return escapeHtml(leadingSpace) +
                 \`<span class="keyword \${keywordClass}">\${escapeHtml(keywordText)}</span>\` +
                 escapeHtml(rest);
        }

        return escapeHtml(text);
      }

      /**
       * Recursively renders an IndentNode as HTML
       */
      function renderNode(node) {
        const childrenHtml = node.children.map(child => renderNode(child)).join('');

        // Calculate margin-left based on indent
        const marginLeft = node.indent * 2;

        const icon = getStatementIcon(node.statementType);

        // For 'other' type nodes, show without icon
        if (node.statementType === 'other') {
          return \`
            <div class="block block-other"
                 data-line="\${node.line}"
                 data-indent="\${node.indent}"
                 data-statement="\${node.statementType}"
                 style="margin-left: \${marginLeft}px;">
              <div class="line-text">\${escapeHtml(node.label)}</div>
              \${childrenHtml}
            </div>
          \`;
        }

        // Highlight the keyword in the label
        const highlightedLabel = highlightKeyword(node.label, node.statementType);

        return \`
          <div class="block"
               data-line="\${node.line}"
               data-indent="\${node.indent}"
               data-statement="\${node.statementType}"
               style="margin-left: \${marginLeft}px;">
            <div class="block-header">
              <span class="statement-icon \${node.statementType}">\${icon}</span>
              <div class="line-text">\${highlightedLabel}</div>
            </div>
            \${childrenHtml}
          </div>
        \`;
      }

      /**
       * Renders the entire tree
       */
      function renderTree(tree) {
        const root = document.getElementById('root');

        if (!tree || tree.length === 0) {
          root.innerHTML = '<div class="empty-state">表示するPythonコードがありません</div>';
          return;
        }

        const html = tree.map(node => renderNode(node)).join('');
        root.innerHTML = html;
      }

      /**
       * Scrolls visualizer to match source code visible range
       */
      function scrollToVisibleRange(firstLine, lastLine) {
        const allBlocks = document.querySelectorAll('.block');

        // Find first block in visible range
        let firstVisibleBlock = null;
        allBlocks.forEach(block => {
          const line = parseInt(block.getAttribute('data-line'), 10);
          if (line >= firstLine && line <= lastLine) {
            if (!firstVisibleBlock) {
              firstVisibleBlock = block;
            }
          }
        });

        // Scroll to first visible block
        if (firstVisibleBlock) {
          firstVisibleBlock.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }

      /**
       * Handle messages from the extension
       */
      window.addEventListener('message', event => {
        const message = event.data;

        switch (message.type) {
          case 'updateTree':
            renderTree(message.tree);
            break;
          case 'emptyState':
            document.getElementById('root').innerHTML =
              \`<div class="empty-state">\${escapeHtml(message.message)}</div>\`;
            break;
          case 'scrollSync':
            scrollToVisibleRange(message.firstVisibleLine, message.lastVisibleLine);
            break;
        }
      });
    })();
  </script>
</body>
</html>`;
}
