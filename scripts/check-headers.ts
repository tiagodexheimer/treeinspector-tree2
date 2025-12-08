
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const directoryPath = path.join(process.cwd(), 'modelo');

function getFirstFile() {
    try {
        const files = fs.readdirSync(directoryPath);
        return files.find(file => file.endsWith('.xlsx') || file.endsWith('.csv'));
    } catch (e) {
        console.error("Could not read directory:", e);
        return null;
    }
}

async function main() {
    const filename = getFirstFile();
    if (!filename) {
        console.error("No .xlsx or .csv file found in web/modelo");
        return;
    }

    console.log(`Reading file: ${filename}`);
    const filePath = path.join(directoryPath, filename);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read headers (first row)
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (json.length > 0) {
        console.log("Headers detected:", json[0]);
        console.log("First row data:", json[1]);
    } else {
        console.log("File appears empty");
    }
}

main();
