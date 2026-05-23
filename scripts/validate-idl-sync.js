const fs = require('fs');
const path = require('path');

// Configuration
const REPO_ROOT = path.resolve(__dirname, '..');
const PROGRAM_DIR = path.join(REPO_ROOT, 'programs');
const FRONTEND_DIR = path.join(REPO_ROOT, 'app');

const SOURCE_IDL = path.join(PROGRAM_DIR, 'target/idl/terraledger.json');
const DEST_JSON = path.join(FRONTEND_DIR, 'src/lib/anchor/terraledger.json');

function validate() {
    console.log('--- Validating IDL Sync ---');

    if (!fs.existsSync(SOURCE_IDL)) {
        console.error(`Error: Source IDL not found at ${SOURCE_IDL}. Run anchor build.`);
        process.exit(1);
    }

    if (!fs.existsSync(DEST_JSON)) {
        console.error(`Error: Destination IDL not found at ${DEST_JSON}. Run yarn sync:idl.`);
        process.exit(1);
    }

    const sourceContent = fs.readFileSync(SOURCE_IDL, 'utf8');
    const destContent = fs.readFileSync(DEST_JSON, 'utf8');

    // Simple string comparison for exact match (including whitespace if they were formatted identically)
    // But better to parse and stringify to be safe against formatting differences
    const sourceObj = JSON.parse(sourceContent);
    const destObj = JSON.parse(destContent);

    const normalizedSource = JSON.stringify(sourceObj, null, 2);
    const normalizedDest = JSON.stringify(destObj, null, 2);

    if (normalizedSource === normalizedDest) {
        console.log('✅ IDL IN SYNC');
        process.exit(0);
    } else {
        console.error('❌ IDL OUT OF SYNC — run yarn sync:idl before committing');
        
        // Basic diff (line by line)
        const sourceLines = normalizedSource.split('\n');
        const destLines = normalizedDest.split('\n');
        
        console.log('\nDifferences detected:');
        // This is a very basic diff, in a real scenario we'd use a diff library but we want no dependencies.
        // We'll just show the first few different lines.
        let diffCount = 0;
        for (let i = 0; i < Math.max(sourceLines.length, destLines.length); i++) {
            if (sourceLines[i] !== destLines[i]) {
                console.log(`Line ${i + 1}:`);
                console.log(`  Source: ${sourceLines[i] || '(empty)'}`);
                console.log(`  Dest:   ${destLines[i] || '(empty)'}`);
                diffCount++;
                if (diffCount >= 5) {
                    console.log('...');
                    break;
                }
            }
        }
        process.exit(1);
    }
}

try {
    validate();
} catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
}
