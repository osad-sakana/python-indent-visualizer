/**
 * Python statement types
 */
export type StatementType =
  | 'if'
  | 'elif'
  | 'else'
  | 'for'
  | 'while'
  | 'def'
  | 'method'
  | 'class'
  | 'try'
  | 'except'
  | 'finally'
  | 'with'
  | 'match'
  | 'case'
  | 'assignment'
  | 'import'
  | 'other';

/**
 * Represents a node in the Python indent tree
 */
export interface IndentNode {
  label: string;      // Trimmed line content (can be multiple lines)
  line: number;       // 0-based line number (first line)
  indent: number;     // Indentation width (spaces)
  children: IndentNode[];
  statementType: StatementType;  // Type of Python statement
  lines?: string[];   // Multiple lines for grouped statements
}

/**
 * Detects the statement type from a line of Python code
 * @param line - Trimmed line of Python code
 * @returns The detected statement type
 */
function detectStatementType(line: string): StatementType {
  // Remove comments
  const codeOnly = line.split('#')[0].trim();

  // Check for decorator
  if (/^@/.test(codeOnly)) return 'other';

  // Check for statement types (in order of specificity)
  if (/^elif\s/.test(codeOnly)) return 'elif';
  if (/^else\s*:/.test(codeOnly)) return 'else';
  if (/^if\s/.test(codeOnly)) return 'if';
  if (/^for\s/.test(codeOnly)) return 'for';
  if (/^while\s/.test(codeOnly)) return 'while';
  if (/^def\s/.test(codeOnly)) return 'def';
  if (/^class\s/.test(codeOnly)) return 'class';
  if (/^try\s*:/.test(codeOnly)) return 'try';
  if (/^except(\s|\()/.test(codeOnly)) return 'except';
  if (/^finally\s*:/.test(codeOnly)) return 'finally';
  if (/^with\s/.test(codeOnly)) return 'with';
  if (/^match\s/.test(codeOnly)) return 'match';
  if (/^case\s/.test(codeOnly)) return 'case';

  return 'other';
}

/**
 * Checks if a statement type is structural (creates a new block)
 */
function isStructuralStatement(type: StatementType): boolean {
  return type !== 'other' && type !== 'assignment' && type !== 'import';
}

/**
 * Detects if a line is an import statement and returns the imported module
 * @param line - Trimmed line of Python code
 * @returns Object with module name, or null if not an import
 */
function detectImport(line: string): { modules: string[] } | null {
  // Match "import module" or "import module as alias"
  const importPattern = /^import\s+(.+)$/;
  const importMatch = line.match(importPattern);

  if (importMatch) {
    const imports = importMatch[1].split(',').map(imp => {
      const parts = imp.trim().split(/\s+as\s+/);
      // Return alias if exists, otherwise the module name
      return parts.length > 1 ? parts[1].trim() : parts[0].trim();
    });
    return { modules: imports };
  }

  // Match "from module import ..."
  const fromPattern = /^from\s+([a-zA-Z_][a-zA-Z0-9_.]*)\s+import\s+(.+)$/;
  const fromMatch = line.match(fromPattern);

  if (fromMatch) {
    const items = fromMatch[2].split(',').map(item => {
      const parts = item.trim().split(/\s+as\s+/);
      // Return alias if exists, otherwise the item name
      return parts.length > 1 ? parts[1].trim() : parts[0].trim();
    });
    return { modules: items };
  }

  return null;
}

/**
 * Detects if a line is an assignment statement and returns the parts
 * @param line - Trimmed line of Python code
 * @returns Object with variable and expression, or null if not an assignment
 */
function detectAssignment(line: string): { variable: string; expression: string } | null {
  // Match assignment pattern: variable_name = expression
  // Exclude comparison operators (==, !=, <=, >=)
  const assignmentPattern = /^([a-zA-Z_][a-zA-Z0-9_,\s\[\]\.]*)(\s*=\s*)(?!=)(.+)$/;
  const match = line.match(assignmentPattern);

  if (match) {
    const variable = match[1].trim();
    const expression = match[3].trim();
    return { variable, expression };
  }

  return null;
}

/**
 * Counts unclosed brackets in a line
 * Returns the net count of opening brackets (positive) or closing brackets (negative)
 */
function countUnclosedBrackets(line: string): number {
  let count = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    // Handle strings
    if (char === '"' || char === "'") {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
      continue;
    }

    // Skip if inside string
    if (inString) {
      continue;
    }

    // Skip comments
    if (char === '#') {
      break;
    }

    // Count brackets
    if (char === '(' || char === '[' || char === '{') {
      count++;
    } else if (char === ')' || char === ']' || char === '}') {
      count--;
    }
  }

  return count;
}

/**
 * Builds an indent tree from Python source code
 * @param text - The Python source code as a string
 * @returns An array of top-level IndentNode objects
 */
export function buildIndentTree(text: string): IndentNode[] {
  const lines = text.split('\n');

  // Root node with indent -1 to serve as the base of the stack
  const root: IndentNode = {
    label: '',
    line: -1,
    indent: -1,
    children: [],
    statementType: 'other'
  };

  // Stack to track parent nodes
  const stack: IndentNode[] = [root];

  // Temporary accumulator for non-structural statements
  let otherLinesBuffer: string[] = [];
  let otherLinesBufferRaw: Array<{text: string, indent: number}> = [];
  let otherLinesStart = -1;
  let otherLinesIndent = -1;

  // Track unclosed brackets
  let unclosedBrackets = 0;

  // Track if we're in a multi-line structural statement (def/class with unclosed brackets)
  let pendingStructuralNode: IndentNode | null = null;
  let pendingStructuralLines: Array<{text: string, indent: number}> = [];
  let pendingStructuralBrackets = 0;

  // Track if we're inside a docstring
  let inDocstring = false;
  let docstringDelimiter = '';

  // Track decorators to attach them to the next function/class
  let decoratorLines: Array<{text: string, indent: number, lineNum: number}> = [];

  const flushPendingStructural = () => {
    if (pendingStructuralNode) {
      // Combine all lines for the structural statement
      const baseIndent = pendingStructuralNode.indent;
      const formattedLines = pendingStructuralLines.map(item => {
        const relativeIndent = Math.max(0, item.indent - baseIndent);
        const spaces = '  '.repeat(relativeIndent / 4);
        return spaces + item.text;
      });

      pendingStructuralNode.label = formattedLines.join('\n');
      pendingStructuralNode.lines = formattedLines;

      // Pop stack to correct level
      while (stack.length > 0 && stack[stack.length - 1].indent >= pendingStructuralNode.indent) {
        stack.pop();
      }

      // Add to parent
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(pendingStructuralNode);
      }

      // Push onto stack
      stack.push(pendingStructuralNode);

      // Clear pending
      pendingStructuralNode = null;
      pendingStructuralLines = [];
      pendingStructuralBrackets = 0;
    }
  };

  const flushOtherLines = () => {
    if (otherLinesBuffer.length > 0) {
      // Pop stack to the correct parent level before adding
      while (stack.length > 0 && stack[stack.length - 1].indent >= otherLinesIndent) {
        stack.pop();
      }

      if (stack.length > 0) {
        // Process lines to normalize indentation
        const baseIndent = otherLinesIndent;
        const formattedLines = otherLinesBufferRaw.map(item => {
          const relativeIndent = Math.max(0, item.indent - baseIndent);
          const spaces = '  '.repeat(relativeIndent / 4); // Convert 4 spaces to 2
          return spaces + item.text;
        });

        const fullText = formattedLines.join('\n');
        const firstLine = formattedLines[0];

        // Check statement type: import > assignment > other
        const importInfo = detectImport(firstLine);
        const assignment = detectAssignment(firstLine);

        let statementType: StatementType = 'other';
        if (importInfo) {
          statementType = 'import';
        } else if (assignment) {
          statementType = 'assignment';
        }

        const node: IndentNode = {
          label: fullText,
          line: otherLinesStart,
          indent: otherLinesIndent,
          children: [],
          statementType: statementType,
          lines: formattedLines
        };
        stack[stack.length - 1].children.push(node);
      }

      otherLinesBuffer = [];
      otherLinesBufferRaw = [];
      otherLinesStart = -1;
      otherLinesIndent = -1;
      unclosedBrackets = 0;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank lines (empty or whitespace-only) separate blocks only if not inside brackets
    if (line.trim() === '') {
      if (unclosedBrackets === 0) {
        // Flush any accumulated 'other' statements
        flushOtherLines();
      } else {
        // Inside brackets - keep the blank line as part of the group
        if (otherLinesBuffer.length > 0) {
          otherLinesBuffer.push('');
          otherLinesBufferRaw.push({text: '', indent: 0});
        }
      }
      continue;
    }

    // Skip comment lines (lines that start with #)
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#')) {
      continue;
    }

    // Handle docstrings (""" or ''')
    if (!inDocstring) {
      // Check if this line starts a docstring
      if (trimmedLine.startsWith('"""') || trimmedLine.startsWith("'''")) {
        const delimiter = trimmedLine.startsWith('"""') ? '"""' : "'''";
        // Check if it's a single-line docstring
        const afterDelimiter = trimmedLine.substring(3);
        if (afterDelimiter.includes(delimiter)) {
          // Single-line docstring - skip it
          continue;
        } else {
          // Multi-line docstring - start tracking
          inDocstring = true;
          docstringDelimiter = delimiter;
          continue;
        }
      }
    } else {
      // We're inside a docstring - check if this line ends it
      if (trimmedLine.includes(docstringDelimiter)) {
        inDocstring = false;
        docstringDelimiter = '';
      }
      continue;
    }

    // Calculate indent level (convert tabs to 4 spaces)
    const expandedLine = line.replace(/\t/g, '    ');
    const indent = expandedLine.length - expandedLine.trimStart().length;

    // Detect statement type
    let statementType = detectStatementType(trimmedLine);

    // Handle decorators (@)
    if (trimmedLine.startsWith('@')) {
      // Store decorator line to attach to next def/class
      decoratorLines.push({text: trimmedLine, indent: indent, lineNum: i});
      continue;
    }

    // Check if this is a method (def inside a class)
    if (statementType === 'def') {
      // Look for a class in the stack
      for (let j = stack.length - 1; j >= 0; j--) {
        if (stack[j].statementType === 'class') {
          statementType = 'method';
          break;
        }
      }
    }

    // Update bracket count
    const bracketChange = countUnclosedBrackets(trimmedLine);

    // Check if we're continuing a pending structural statement
    if (pendingStructuralNode) {
      pendingStructuralLines.push({text: trimmedLine, indent: indent});
      pendingStructuralBrackets += bracketChange;

      // If brackets are closed, flush the pending structural node
      if (pendingStructuralBrackets <= 0) {
        flushPendingStructural();
      }
      continue;
    }

    if (isStructuralStatement(statementType)) {
      // Flush any accumulated 'other' statements first
      flushOtherLines();

      // Prepare label with decorators if this is def/class
      let nodeLabel = trimmedLine;
      let nodeLineNum = i;
      let allLines: Array<{text: string, indent: number}> = [{text: trimmedLine, indent: indent}];

      if ((statementType === 'def' || statementType === 'method' || statementType === 'class') && decoratorLines.length > 0) {
        // Prepend decorators to the function/class
        const baseIndent = decoratorLines[0].indent;
        const decoratorTexts = decoratorLines.map(dec => {
          const relativeIndent = Math.max(0, dec.indent - baseIndent);
          const spaces = '  '.repeat(relativeIndent / 4);
          return spaces + dec.text;
        });

        // Add the def/class line
        const relativeIndent = Math.max(0, indent - baseIndent);
        const spaces = '  '.repeat(relativeIndent / 4);
        decoratorTexts.push(spaces + trimmedLine);

        nodeLabel = decoratorTexts.join('\n');
        nodeLineNum = decoratorLines[0].lineNum;

        // Prepare allLines for potential multi-line statement
        allLines = [
          ...decoratorLines.map(dec => ({text: dec.text, indent: dec.indent})),
          {text: trimmedLine, indent: indent}
        ];

        // Clear decorators
        decoratorLines = [];
      }

      // Create node for this structural statement
      const node: IndentNode = {
        label: nodeLabel,
        line: nodeLineNum,
        indent: indent,
        children: [],
        statementType: statementType
      };

      // Check if this statement has unclosed brackets
      if (bracketChange > 0) {
        // Start pending structural node
        pendingStructuralNode = node;
        pendingStructuralLines = allLines;
        pendingStructuralBrackets = bracketChange;
      } else {
        // Complete statement on single line
        // Pop stack until we find the parent (node with lower indent)
        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }

        // Add this node to the parent's children
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        }

        // Push this node onto the stack
        stack.push(node);
      }
    } else {
      // Non-structural statement - clear any pending decorators
      decoratorLines = [];

      // Non-structural statement - accumulate it
      if (otherLinesBuffer.length === 0) {
        // Start a new group
        otherLinesStart = i;
        otherLinesIndent = indent;
        otherLinesBuffer.push(trimmedLine);
        otherLinesBufferRaw.push({text: trimmedLine, indent: indent});
        unclosedBrackets += bracketChange;

        // If brackets are closed, flush immediately (single statement)
        if (unclosedBrackets <= 0) {
          flushOtherLines();
        }
      } else if (unclosedBrackets > 0) {
        // Inside brackets - add to current group (multi-line statement)
        otherLinesBuffer.push(trimmedLine);
        otherLinesBufferRaw.push({text: trimmedLine, indent: indent});
        unclosedBrackets += bracketChange;

        // If brackets are now closed, flush the statement
        if (unclosedBrackets <= 0) {
          flushOtherLines();
        }
      } else {
        // Brackets are closed and we have a new statement - flush previous and start new
        flushOtherLines();

        // Start new statement
        otherLinesStart = i;
        otherLinesIndent = indent;
        otherLinesBuffer.push(trimmedLine);
        otherLinesBufferRaw.push({text: trimmedLine, indent: indent});
        unclosedBrackets += bracketChange;

        // If brackets are closed, flush immediately (single statement)
        if (unclosedBrackets <= 0) {
          flushOtherLines();
        }
      }
    }
  }

  // Flush any remaining 'other' statements
  flushOtherLines();

  // Flush any pending structural statement
  flushPendingStructural();

  return root.children;
}
