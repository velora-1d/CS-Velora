const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');

walk(apiDir, function(filePath) {
  if (filePath.endsWith('route.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Fix the signature param type
    if (content.includes('{ params: { id: string } }')) {
      content = content.replace(/{ params }: { params: { id: string } }/g, '{ params }: { params: Promise<{ id: string }> }');
      content = content.replace(/{ params }: { params: { id: string; } }/g, '{ params }: { params: Promise<{ id: string }> }'); // just in case
      changed = true;
    }

    // Fix the destructuring without await
    if (content.includes('const { id } = params;')) {
      content = content.replace(/const { id } = params;/g, 'const { id } = await params;');
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
