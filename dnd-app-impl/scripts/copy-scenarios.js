const fs = require('fs');
const path = require('path');

// Define source and destination directories
const sourceDir = path.join(__dirname, '..', '..', 'Init');
const destDir = path.join(__dirname, '..', 'public', 'scenarios');

// Ensure the destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log(`Created directory: ${destDir}`);
}

// Read all files in the source directory
try {
  const files = fs.readdirSync(sourceDir);
  
  // Filter for .json files
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  if (jsonFiles.length === 0) {
    console.log('No JSON files found in the Init directory.');
    return;
  }
  
  // Copy each JSON file to the destination
  jsonFiles.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);
    
    // Read and write the file content
    const fileContent = fs.readFileSync(sourcePath, 'utf8');
    fs.writeFileSync(destPath, fileContent, 'utf8');
    
    console.log(`Copied: ${file}`);
  });
  
  console.log(`Successfully copied ${jsonFiles.length} scenario files to ${destDir}`);
} catch (error) {
  console.error('Error copying scenario files:', error);
} 