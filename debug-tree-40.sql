-- Query para verificar associação de pragas
-- Execute isso no seu cliente SQL/Prisma Studio

-- Ver árvore 40
SELECT * FROM "Tree" WHERE numero_etiqueta = '40';

-- Ver inspeção da árvore 40
SELECT i.* FROM "Inspection" i
JOIN "Tree" t ON t.id_arvore = i."treeId"
WHERE t.numero_etiqueta = '40';

-- Ver dados fitossanitários da árvore 40
SELECT p.* FROM "PhytosanitaryData" p
JOIN "Inspection" i ON i.id_inspecao = p."inspectionId"  
JOIN "Tree" t ON t.id_arvore = i."treeId"
WHERE t.numero_etiqueta = '40';

-- Ver pragas associadas à árvore 40
SELECT pc.* FROM "PestCatalog" pc
JOIN "_PestCatalogToPhytosanitaryData" rel ON rel."A" = pc.id
JOIN "PhytosanitaryData" p ON p.id = rel."B"
JOIN "Inspection" i ON i.id_inspecao = p."inspectionId"
JOIN "Tree" t ON t.id_arvore = i."treeId"
WHERE t.numero_etiqueta = '40';
