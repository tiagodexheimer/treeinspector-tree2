
async function main() {
    const payload = {
        sync_batch: [
            {
                mobile_id: 'test-uuid-simulated-mobile',
                tree: {
                    id_arvore: 1, // Updating Tree #1 from the Excel import
                    numero_etiqueta: 'M001-UPDATED',
                    rua: 'Rua Teste Sync',
                    numero: '123',
                    bairro: 'Centro',
                    lat: -23.12345,
                    lng: -46.12345,
                    speciesId: 1 // Assuming species 1 exists
                },
                inspection: {
                    data_inspecao: new Date().toISOString(),
                    dendrometric: {
                        dap_cm: 55.5, // Grew a bit
                        cap_cm: 174.3,
                        altura_total_m: 12.5,
                        altura_copa_m: 8.5
                    },
                    phytosanitary: {
                        estado_saude: 'Bom',
                        epiphytes: true, // Has epiphytes now
                        problemas: [{ type: 'Dano', description: 'Cicatriz de poda antiga', severity: 1 }]
                    },
                    management: {
                        action_type: 'Poda',
                        poda_type: 'Limpeza',
                        justification: 'Galhos secos na copa'
                    },
                    photos: [
                        { file_name: 'foto_teste_1.jpg', captured_at: new Date().toISOString() }
                    ]
                }
            }
        ]
    };

    try {
        console.log('Sending payload to http://localhost:3000/api/sync ...');
        // Using built-in fetch (Node 18+)
        const response = await fetch('http://localhost:3000/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
