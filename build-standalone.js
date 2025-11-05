import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const processedFiles = new Set();
const fileContents = [];

function resolveImportPath(fromFile, importPath) {
  const fromDir = path.dirname(fromFile);
  let resolvedPath = path.resolve(fromDir, importPath);

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    resolvedPath = path.join(resolvedPath, 'index.ts');
  }

  if (!fs.existsSync(resolvedPath) && !resolvedPath.endsWith('.ts')) {
    const tsPath = resolvedPath + '.ts';
    if (fs.existsSync(tsPath)) {
      resolvedPath = tsPath;
    }
  }

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    const basePath = resolvedPath.replace(/\.ts$/, '');
    const indexPath = path.join(basePath, 'index.ts');
    if (fs.existsSync(indexPath)) {
      resolvedPath = indexPath;
    }
  }

  return resolvedPath;
}

function extractImports(content) {
  const imports = [];
  const lines = content.split('\n');
  let inImport = false;
  let currentImport = '';

  for (const line of lines) {
    if (inImport) {
      currentImport += ' ' + line.trim();
      if (line.includes(';') || line.includes('from')) {
        const match = currentImport.match(/from\s+['"](.+)['"]/);
        if (match) imports.push(match[1]);
        inImport = false;
        currentImport = '';
      }
    } else {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ')) {
        if (line.includes(';') || line.includes('from')) {
          const match = line.match(/from\s+['"](.+)['"]/);
          if (match) imports.push(match[1]);
        } else {
          inImport = true;
          currentImport = line;
        }
      } else if (trimmed.startsWith('export ') && trimmed.includes('from')) {
        const match = line.match(/from\s+['"](.+)['"]/);
        if (match) imports.push(match[1]);
      }
    }
  }

  return imports;
}

function removeImportsAndExports(content) {
  const lines = content.split('\n');
  const result = [];
  let inImportBlock = false;
  let inExportBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip import statements
    if (trimmed.startsWith('import ')) {
      inImportBlock = true;
      if (!trimmed.includes(';')) continue;
      inImportBlock = false;
      continue;
    }

    if (inImportBlock) {
      if (trimmed.includes(';')) inImportBlock = false;
      continue;
    }

    // Skip export {...} from and export type {...} from statements (multi-line)
    if (trimmed.startsWith('export {') || trimmed.startsWith('export type {')) {
      inExportBlock = true;
      // Check if it's a single line with from
      if (trimmed.includes('from ') && trimmed.includes(';')) {
        inExportBlock = false;
        continue;
      }
      if (!trimmed.includes('}')) {
        continue;
      }
      // Check if next line has from
      const nextLine = lines[i + 1]?.trim() || '';
      if (nextLine.startsWith('from ')) {
        continue;
      }
      // Single-line export {} without from - skip it entirely (it's a re-export)
      inExportBlock = false;
      continue;
    }

    if (inExportBlock) {
      if (trimmed.includes(';')) {
        inExportBlock = false;
      } else if (trimmed.includes('}')) {
        // Check if next line has from
        const nextLine = lines[i + 1]?.trim() || '';
        if (!nextLine.startsWith('from')) {
          inExportBlock = false;
        }
      }
      continue;
    }

    // Skip export from statements (including export type ... from)
    if (trimmed.startsWith('export ') && trimmed.includes(' from ')) {
      if (!trimmed.includes(';')) {
        for (let j = i + 1; j < lines.length; j++) {
          i = j;
          if (lines[j].includes(';')) break;
        }
      }
      continue;
    }

    // Handle export keyword
    let processedLine = line;
    if (trimmed.startsWith('export ')) {
      // Keep export for class, interface, type, const, function, enum declarations
      // Inside a namespace, exports become namespace members
      if (trimmed.match(/^export\s+(class|interface|type|const|let|var|function|enum|abstract\s+class)\s/)) {
        processedLine = line; // Keep the export
      } else if (trimmed.startsWith('export default ')) {
        // Skip export default statements entirely (they're re-exports)
        continue;
      } else {
        // For other exports, remove the export keyword
        processedLine = line.replace(/^(\s*)export\s+/, '$1');
      }
    }

    result.push(processedLine);
  }

  return result.join('\n');
}

function processFile(filePath) {
  const normalizedPath = path.resolve(filePath);

  if (processedFiles.has(normalizedPath)) return;
  if (!fs.existsSync(normalizedPath)) {
    console.warn(`Warning: File not found: ${normalizedPath}`);
    return;
  }
  if (normalizedPath.includes('.test.') || normalizedPath.includes('__tests__')) return;

  console.log(`Processing: ${path.relative(__dirname, normalizedPath)}`);
  processedFiles.add(normalizedPath);

  let content = fs.readFileSync(normalizedPath, 'utf8');

  // Process imports first (depth-first)
  const imports = extractImports(content);
  for (const importPath of imports) {
    if (!importPath.startsWith('.')) continue;
    const resolvedPath = resolveImportPath(normalizedPath, importPath);
    processFile(resolvedPath);
  }

  // Remove imports and exports
  content = removeImportsAndExports(content);

  fileContents.push({
    path: normalizedPath,
    relativePath: path.relative(__dirname, normalizedPath),
    fileName: path.basename(normalizedPath, '.ts'),
    content: content.trim()
  });
}

console.log('Building Turbo standalone TypeScript bundle...\n');

// Process entry point
const entryPoint = path.resolve(__dirname, './src/index.ts');
processFile(entryPoint);

// Generate bundle wrapped in namespace
const bundle = `/**
 * TURBO - TURn-Based Operations
 * Standalone TypeScript Bundle (https://github.com/suppers-ai/turbo)
 *
 * This file contains the complete Turbo library in a single standalone TypeScript file.
 * All code is wrapped in the Turbo namespace to avoid global scope pollution.
 *
 * Usage:
 *   // Access types and classes via the Turbo namespace
 *   const game = new Turbo.GameController(rules);
 *   const ai = new Turbo.RandomAI(config);
 *
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated: ${new Date().toISOString()}
 * Files: ${processedFiles.size}
 *
 * @version 2.0.0
 * @license MIT
 */

/* eslint-disable */
/* tslint:disable */

// ==================== Turbo Namespace ====================

namespace Turbo {

  // ==================== Library Code ====================

${fileContents.map(file => {
  if (!file.content.trim()) return '';

  // Indent all lines by 2 spaces for namespace
  const indented = file.content.split('\n').map(line => {
    if (line.trim() === '') return '';
    return '  ' + line;
  }).join('\n');

  return `  // ==================== ${file.relativePath} ====================\n\n${indented}`;
}).filter(Boolean).join('\n\n')}

}

// Export the namespace as a module
export { Turbo };

// Make Turbo available globally
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Turbo = Turbo;
}
`;

// Write output
const outputPath = path.join(__dirname, 'Turbo-Standalone.ts');
fs.writeFileSync(outputPath, bundle, 'utf8');

console.log(`\n✓ Standalone TypeScript bundle created!`);
console.log(`  Output: ${path.relative(__dirname, outputPath)}`);
console.log(`  Files bundled: ${processedFiles.size}`);
console.log(`  Size: ${(bundle.length / 1024).toFixed(2)} KB`);
console.log(`\nAll code is in the Turbo namespace.`);
console.log(`Example usage: const game = new Turbo.GameController(rules);`);
