
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import proj4 from 'proj4';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define UTM Zone 22S projection (Esteio, RS) and WGS84
const utmProjection = "+proj=utm +zone=22 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
const wgs84Projection = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

const directoryPath = path.join(process.cwd(), 'modelo');

function getFirstFile() {
    try {
        const files = fs.readdirSync(directoryPath);
        return files.find(file => file.endsWith('.xlsx')) || null;
    } catch (e) {
        console.error("Could not read directory:", e);
        return null;
    }
}

async function main() {
    const filename = getFirstFile();
    if (!filename) {
        console.log("No .xlsx file found.");
        return;
    }
    console.log(`Importing from: ${filename}`);

    const workbook = xlsx.readFile(path.join(directoryPath, filename));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
        console.log("No data found in file.");
        return;
    }

    console.log(`Found ${data.length} rows.`);
    console.log("Keys in first row:", Object.keys(data[0]));

    // Limit to 50 rows
    const rowsToImport = data.slice(0, 50);

    for (const [index, row] of rowsToImport.entries()) {
        try {
            // Helper to get case-insensitive/trimmed key
            const getKey = (keyName: string) => Object.keys(row).find(k => k.trim().toLowerCase() === keyName.toLowerCase());

            // Map fields
            const nomeCientificoKey = getKey('nome científico') || getKey('nome cientifico');
            const nomeComumKey = getKey('nome popular');
            const familiaKey = getKey('família') || getKey('familia');
            const capKey = getKey('cap');
            const alturaKey = getKey('altura');
            const ruaKey = getKey('rua');
            const numKey = getKey('n') || getKey('nº') || getKey('numero');
            const bairroKey = getKey('bairro');
            const utmEKey = Object.keys(row).find(k => k.includes('UTM E'));
            const utmSKey = Object.keys(row).find(k => k.includes('UTM S'));

            const nomeCientifico = (nomeCientificoKey ? row[nomeCientificoKey] : 'Desconhecida')?.trim() || 'Desconhecida';
            const nomeComum = (nomeComumKey ? row[nomeComumKey] : 'Desconhecida')?.trim() || 'Desconhecida';
            const familia = (familiaKey ? row[familiaKey] : null)?.trim();

            // Dendrometrics
            const cap = capKey ? Number(row[capKey]) : 0;
            const dap = cap > 0 ? cap / Math.PI : 0;
            const altura = alturaKey ? Number(row[alturaKey]) : 0;

            // Location
            const rua = ruaKey ? row[ruaKey]?.toString().trim() : undefined;
            const numero = numKey ? row[numKey]?.toString().trim() : undefined;
            const bairro = bairroKey ? row[bairroKey]?.toString().trim() : undefined;
            const utmE = utmEKey ? row[utmEKey] : undefined;
            const utmS = utmSKey ? row[utmSKey] : undefined;

            let lat: number | null = null;
            let lng: number | null = null;

            if (utmE && utmS) {
                try {
                    const coords = proj4(utmProjection, wgs84Projection, [Number(utmE), Number(utmS)]);
                    lng = coords[0];
                    lat = coords[1];
                } catch (e) {
                    console.error(`Error converting coords for row ${index}:`, e);
                }
            }

            // 1. Upsert Species
            const species = await prisma.species.upsert({
                where: { nome_cientifico: nomeCientifico },
                update: { family: familia },
                create: {
                    nome_cientifico: nomeCientifico,
                    nome_comum: nomeComum,
                    family: familia
                }
            });

            // 2. Create Tree
            const tree = await prisma.tree.create({
                data: {
                    speciesId: species.id_especie,
                    rua,
                    numero: numero ? String(numero) : null,
                    bairro,
                    lat,
                    lng,
                    endereco: `${rua || ''}, ${numero || ''}, ${bairro || ''}`.replace(/^, /, '').replace(/, $/, ''),
                    numero_etiqueta: row['ID'] ? String(row['ID']) : undefined
                }
            });

            // 3. Create Initial Inspection
            await prisma.inspection.create({
                data: {
                    treeId: tree.id_arvore,
                    dendrometrics: {
                        create: {
                            dap1_cm: dap,
                            altura_total_m: altura,
                            altura_copa_m: 0,
                            valid_from: new Date()
                        }
                    },
                    phytosanitary: {
                        create: {
                            estado_saude: row['Estado geral'] || 'Regular',
                            epiphytes: false,
                            valid_from: new Date()
                        }
                    }
                }
            });

            console.log(`Imported Row ${index + 1}: ${nomeComum} (${nomeCientifico}) at ${rua}, ${bairro}`);

        } catch (error) {
            console.error(`Failed to import row ${index + 1}:`, error);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
