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
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 8px;
      margin: 4px 0;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .block:hover {
      background-color: var(--vscode-list-hoverBackground);
    }

    .block-header {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 4px;
    }

    .statement-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      height: 20px;
      padding: 0 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .line-text {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      user-select: text;
      white-space: pre-wrap;
      word-break: break-word;
      flex: 1;
    }

    /* Statement type colors and icons */
    .statement-icon.if,
    .statement-icon.elif,
    .statement-icon.else {
      background-color: rgba(100, 180, 255, 0.8);
      color: white;
    }

    .statement-icon.for,
    .statement-icon.while {
      background-color: rgba(150, 100, 255, 0.8);
      color: white;
    }

    .statement-icon.def {
      background-color: rgba(100, 200, 150, 0.8);
      color: white;
    }

    .statement-icon.method {
      background-color: rgba(80, 180, 180, 0.8);
      color: white;
    }

    .statement-icon.class {
      background-color: rgba(255, 150, 50, 0.8);
      color: white;
    }

    .statement-icon.try,
    .statement-icon.except,
    .statement-icon.finally {
      background-color: rgba(255, 100, 100, 0.8);
      color: white;
    }

    .statement-icon.with {
      background-color: rgba(200, 200, 100, 0.8);
      color: white;
    }

    .statement-icon.match,
    .statement-icon.case {
      background-color: rgba(255, 100, 200, 0.8);
      color: white;
    }

    .statement-icon.other {
      background-color: rgba(120, 120, 120, 0.5);
      color: white;
    }

    /* Keyword highlighting */
    .keyword {
      font-weight: bold;
    }

    .keyword-if,
    .keyword-elif,
    .keyword-else {
      color: rgba(100, 180, 255, 1);
    }

    .keyword-for,
    .keyword-while {
      color: rgba(150, 100, 255, 1);
    }

    .keyword-def {
      color: rgba(100, 200, 150, 1);
    }

    .keyword-method {
      color: rgba(80, 180, 180, 1);
    }

    .keyword-class {
      color: rgba(255, 150, 50, 1);
    }

    .keyword-try,
    .keyword-except,
    .keyword-finally {
      color: rgba(255, 100, 100, 1);
    }

    .keyword-with {
      color: rgba(200, 200, 100, 1);
    }

    .keyword-match,
    .keyword-case {
      color: rgba(255, 100, 200, 1);
    }

    /* Border colors for blocks by statement type */
    .block[data-statement="if"],
    .block[data-statement="elif"],
    .block[data-statement="else"] {
      border-left: 3px solid rgba(100, 180, 255, 0.8);
    }

    .block[data-statement="for"],
    .block[data-statement="while"] {
      border-left: 3px solid rgba(150, 100, 255, 0.8);
    }

    .block[data-statement="def"] {
      border-left: 3px solid rgba(100, 200, 150, 0.8);
    }

    .block[data-statement="method"] {
      border-left: 3px solid rgba(80, 180, 180, 0.8);
    }

    .block[data-statement="class"] {
      border-left: 3px solid rgba(255, 150, 50, 0.8);
    }

    .block[data-statement="try"],
    .block[data-statement="except"],
    .block[data-statement="finally"] {
      border-left: 3px solid rgba(255, 100, 100, 0.8);
    }

    .block[data-statement="with"] {
      border-left: 3px solid rgba(200, 200, 100, 0.8);
    }

    .block[data-statement="match"],
    .block[data-statement="case"] {
      border-left: 3px solid rgba(255, 100, 200, 0.8);
    }

    .block {
      position: relative;
    }

    /* Style for 'other' type blocks (grouped statements) */
    .block-other {
      border-left: 2px solid rgba(120, 120, 120, 0.3);
      background-color: rgba(120, 120, 120, 0.05);
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
          'if': '条件',
          'elif': '条件',
          'else': '条件',
          'for': 'ループ',
          'while': 'ループ',
          'def': '関数',
          'method': 'メソッド',
          'class': 'クラス',
          'try': '例外',
          'except': '例外',
          'finally': '例外',
          'with': 'with',
          'match': 'マッチ',
          'case': 'マッチ',
          'other': '··'
        };
        return icons[type] || '··';
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

        // Add click handlers to all blocks
        document.querySelectorAll('.block').forEach(block => {
          block.addEventListener('click', (e) => {
            // Only trigger if clicking the block itself, not a child block
            const clickedElement = e.target;
            const isDirectClick = clickedElement === block ||
                clickedElement.classList.contains('line-text') ||
                clickedElement.classList.contains('block-header') ||
                clickedElement.classList.contains('statement-icon');

            if (isDirectClick) {
              const line = parseInt(block.getAttribute('data-line'), 10);
              vscode.postMessage({
                type: 'revealLine',
                line: line
              });
              e.stopPropagation();
            }
          });
        });
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
        }
      });
    })();
  </script>
</body>
</html>`;
}
