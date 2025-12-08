/**
 * Represents a node in the Python indent tree
 */
export interface IndentNode {
  label: string;      // Trimmed line content
  line: number;       // 0-based line number
  indent: number;     // Indentation width (spaces)
  children: IndentNode[];
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
    children: []
  };

  // Stack to track parent nodes
  const stack: IndentNode[] = [root];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip blank lines (empty or whitespace-only)
    if (line.trim() === '') {
      continue;
    }

    // Calculate indent level (convert tabs to 4 spaces)
    const expandedLine = line.replace(/\t/g, '    ');
    const indent = expandedLine.length - expandedLine.trimStart().length;

    // Create node for this line
    const node: IndentNode = {
      label: line.trim(),
      line: i,
      indent: indent,
      children: []
    };

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

  return root.children;
}
