import * as vscode from 'vscode';
import { buildIndentTree } from './indentTree';
import { getWebviewContent } from './webviewContent';

let currentPanel: vscode.WebviewPanel | undefined = undefined;
let updateTimeout: NodeJS.Timeout | undefined = undefined;
let lastPythonDocument: vscode.TextDocument | undefined = undefined;

/**
 * Activates the extension
 */
export function activate(context: vscode.ExtensionContext) {
  // Register the command to open the visualizer
  const disposable = vscode.commands.registerCommand(
    'python-indent-visualizer.open',
    () => {
      if (currentPanel) {
        // If panel already exists, reveal it
        currentPanel.reveal(vscode.ViewColumn.Beside);
      } else {
        // Create new panel
        currentPanel = vscode.window.createWebviewPanel(
          'pythonIndentVisualizer',
          'Python Indent Visualizer',
          vscode.ViewColumn.Beside,
          {
            enableScripts: true,
            retainContextWhenHidden: true
          }
        );

        // Set the HTML content
        currentPanel.webview.html = getWebviewContent(
          currentPanel.webview,
          context.extensionUri
        );

        // Handle panel disposal
        currentPanel.onDidDispose(
          () => {
            currentPanel = undefined;
            if (updateTimeout) {
              clearTimeout(updateTimeout);
              updateTimeout = undefined;
            }
          },
          null,
          context.subscriptions
        );

        // Handle messages from the webview
        currentPanel.webview.onDidReceiveMessage(
          message => {
            switch (message.type) {
              case 'revealLine':
                revealLine(message.line);
                break;
            }
          },
          null,
          context.subscriptions
        );

        // Initial update
        updateVisualization();
      }
    }
  );

  context.subscriptions.push(disposable);

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (currentPanel) {
        debouncedUpdate();
      }
    })
  );

  // Listen for text document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (currentPanel && vscode.window.activeTextEditor?.document === event.document) {
        debouncedUpdate();
      }
    })
  );
}

/**
 * Deactivates the extension
 */
export function deactivate() {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }
}

/**
 * Debounced update function (300ms delay)
 */
function debouncedUpdate() {
  if (updateTimeout) {
    clearTimeout(updateTimeout);
  }

  updateTimeout = setTimeout(() => {
    updateVisualization();
    updateTimeout = undefined;
  }, 300);
}

/**
 * Updates the webview with the current document's indent tree
 */
function updateVisualization() {
  if (!currentPanel) {
    return;
  }

  const editor = vscode.window.activeTextEditor;

  // Check if there's an active editor
  if (!editor) {
    // If no editor but we have a last Python document, show that
    if (lastPythonDocument) {
      const text = lastPythonDocument.getText();
      const tree = buildIndentTree(text);
      currentPanel.webview.postMessage({
        type: 'updateTree',
        tree: tree
      });
      return;
    }

    currentPanel.webview.postMessage({
      type: 'emptyState',
      message: 'Pythonファイルを開いてください'
    });
    return;
  }

  // Check if the active document is Python
  if (editor.document.languageId !== 'python') {
    // Not Python, keep showing last Python document if available
    if (lastPythonDocument) {
      const text = lastPythonDocument.getText();
      const tree = buildIndentTree(text);
      currentPanel.webview.postMessage({
        type: 'updateTree',
        tree: tree
      });
      return;
    }

    currentPanel.webview.postMessage({
      type: 'emptyState',
      message: 'Pythonファイルを開いてください'
    });
    return;
  }

  // Save this as the last Python document
  lastPythonDocument = editor.document;

  // Get the document text and build the tree
  const text = editor.document.getText();
  const tree = buildIndentTree(text);

  // Send the tree to the webview
  currentPanel.webview.postMessage({
    type: 'updateTree',
    tree: tree
  });
}

/**
 * Reveals a specific line in the editor
 * @param line - The 0-based line number to reveal
 */
function revealLine(line: number) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  // Create a range for the line
  const range = new vscode.Range(
    new vscode.Position(line, 0),
    new vscode.Position(line, 0)
  );

  // Reveal the range and move the cursor
  editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
  editor.selection = new vscode.Selection(range.start, range.start);
}
