const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'modelo', 'Diagnóstico flora com coordenadas.xlsx');
console.log(`Reading file: ${filePath}`);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Header array
const headers = data[0];
const firstRow = data[1];

console.log('--- HEADERS ---');
console.log(JSON.stringify(headers, null, 2));

console.log('--- FIRST ROW ---');
console.log(JSON.stringify(firstRow, null, 2));

console.log(`Total Rows: ${data.length}`);
