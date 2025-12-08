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

    .line-text {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      margin-bottom: 4px;
      user-select: text;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* Color coding by indent level */
    .block[data-indent="0"] {
      background-color: rgba(100, 150, 200, 0.1);
      margin-left: 0px;
    }

    .block[data-indent="4"] {
      background-color: rgba(150, 100, 200, 0.1);
      margin-left: 8px;
    }

    .block[data-indent="8"] {
      background-color: rgba(200, 150, 100, 0.1);
      margin-left: 16px;
    }

    .block[data-indent="12"] {
      background-color: rgba(100, 200, 150, 0.1);
      margin-left: 24px;
    }

    .block[data-indent="16"] {
      background-color: rgba(200, 100, 150, 0.1);
      margin-left: 32px;
    }

    /* For deeper indents, calculate margin programmatically */
    .block {
      position: relative;
    }
  </style>
</head>
<body>
  <div id="root">
    <div class="empty-state">Open a Python file to visualize its indent structure</div>
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
       * Recursively renders an IndentNode as HTML
       */
      function renderNode(node) {
        const childrenHtml = node.children.map(child => renderNode(child)).join('');

        // Calculate margin-left based on indent
        const marginLeft = node.indent * 2;

        return \`
          <div class="block"
               data-line="\${node.line}"
               data-indent="\${node.indent}"
               style="margin-left: \${marginLeft}px;">
            <div class="line-text">\${escapeHtml(node.label)}</div>
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
          root.innerHTML = '<div class="empty-state">No Python code to visualize</div>';
          return;
        }

        const html = tree.map(node => renderNode(node)).join('');
        root.innerHTML = html;

        // Add click handlers to all blocks
        document.querySelectorAll('.block').forEach(block => {
          block.addEventListener('click', (e) => {
            // Only trigger if clicking the block itself, not a child block
            if (e.target === block || e.target.classList.contains('line-text')) {
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
