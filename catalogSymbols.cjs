(function () {
  const fs = require('fs');
  const path = require('path');
  const esprima = require('esprima');
  const estraverse = require('estraverse');

  const rootDir = path.join(__dirname, '../proj/crap now sort of orig js'); // Replace with your project directory

  // Check if rootDir exists
  if (!fs.existsSync(rootDir)) {
    console.error('Root directory does not exist:', rootDir);
    return;
  }

  // Function to extract symbols from a single file
  function extractSymbolsFromFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const ast = esprima.parseScript(fileContent, { loc: true, range: true });
    let symbols = { functions: [], variables: [] };

    estraverse.traverse(ast, {
      enter(node) {
        if (node.type === 'FunctionDeclaration' && node.id && node.id.type === 'Identifier') {
          symbols.functions.push(node.id.name);
        } else if (node.type === 'VariableDeclarator' && node.init && node.init.type === 'FunctionExpression' && node.id && node.id.type === 'Identifier') {
          symbols.functions.push(node.id.name);
        } else if (node.type === 'ArrowFunctionExpression' && node.parent && node.parent.type === 'VariableDeclarator' && node.parent.id && node.parent.id.type === 'Identifier') {
          symbols.functions.push(node.parent.id.name);
        } else if (node.type === 'VariableDeclaration') {
          node.declarations.forEach(decl => {
            if (decl.id && decl.id.type === 'Identifier' && decl.init && decl.init.type !== 'FunctionExpression') {
              symbols.variables.push(decl.id.name);
            }
          });
        } else if (node.type === 'Property' && node.value && node.value.type === 'FunctionExpression' && node.key && node.key.type === 'Identifier') {
          symbols.functions.push(node.key.name);
        }
      }
    });

    return symbols;
  }

  // Function to process all JavaScript files in a directory
  function processDirectory(dir) {
    const entries = fs.readdirSync(dir);
    let allSymbols = [];

    entries.forEach(entry => {
      const entryPath = path.join(dir, entry);
      const stats = fs.statSync(entryPath);

      if (stats.isDirectory()) {
        allSymbols = allSymbols.concat(processDirectory(entryPath));
      } else if (path.extname(entry) === '.js') {
        const fileSymbols = extractSymbolsFromFile(entryPath);
        if (fileSymbols.functions.length > 0 || fileSymbols.variables.length > 0) {
          allSymbols.push({
            filePath: path.relative(rootDir, entryPath),
            symbols: {
              functions: fileSymbols.functions,
              variables: fileSymbols.variables
            }
          });
        }
      }
    });

    return allSymbols;
  }

  // Main function to start processing from a root directory
  function main() {
    const symbols = processDirectory(rootDir);

    // Output the symbols to a JSON file
    fs.writeFileSync('symbols_catalog.json', JSON.stringify(symbols, null, 2));
    console.log('Symbols catalog generated successfully.');
  }

  main();
})();