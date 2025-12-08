# Guia de Migração para Neon Database

## Passo 1: Criar Conta Neon (Grátis)

1. Acesse: https://neon.tech
2. Clique em **"Sign Up"** e crie uma conta (pode usar GitHub)
3. Neon oferece plano gratuito com:
   - 0.5 GB de armazenamento
   - PostgreSQL 15+ com PostGIS suportado
   - Ideal para desenvolvimento e pequenos projetos

## Passo 2: Criar Projeto e Database

1. No Dashboard da Neon, clique em **"Create Project"**
2. Configure:
   - **Project Name**: TreeInspector
   - **Region**: `South America (São Paulo)` (para menor latência)
   - **PostgreSQL Version**: 15 ou superior
3. Clique em **"Create Project"**

## Passo 3: Habilitar PostGIS

1. No projeto criado, vá em **"SQL Editor"** (menu lateral)
2. Execute o seguinte comando SQL:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. Verifique se foi instalado:

```sql
SELECT PostGIS_Version();
```

## Passo 4: Obter Connection String

1. No Dashboard, clique na aba **"Connection Details"**
2. Copie a **"Connection String"** (formato: `postgresql://user:password@host/database`)
3. Ela deve se parecer com:
   ```
   postgresql://neondb_owner:XXXXX@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## Passo 5: Atualizar `.env` do Projeto Web

1. Abra o arquivo `c:\Projetos\treeinspector-tree\web\.env`
2. Substitua o `DATABASE_URL` atual pelo connection string da Neon:

```env
DATABASE_URL="postgresql://neondb_owner:XXXXX@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

3. **Importante**: Mantenha as aspas e adicione `?sslmode=require` no final se não estiver presente

## Passo 6: Executar Migração do Schema

No terminal, dentro da pasta `web`:

```powershell
cd c:\Projetos\treeinspector-tree\web
npx prisma db push
```

Este comando irá:
- Criar todas as tabelas no Neon
- Aplicar a extensão PostGIS
- Configurar os índices e relacionamentos

## Passo 7: Verificar Migração

Execute este comando para abrir o Prisma Studio e visualizar o banco:

```powershell
npx prisma studio
```

Você deverá ver todas as tabelas criadas (Species, Tree, Inspection, ServiceOrder, etc.)

---

## 🎯 Próximos Passos

Após a migração bem-sucedida:
1. ✅ Testar API Routes com o novo banco
2. ✅ Implementar Vercel Blob Storage (Fase 2)
3. ✅ Criar APIs de Service Orders (Fase 3)

## ⚠️ Notas Importantes

- **Backup**: Se você tem dados no PostgreSQL local, exporte antes:
  ```powershell
  pg_dump -U postgres treeinspector > backup.sql
  ```
- **Importar para Neon**: Use o SQL Editor da Neon para executar o arquivo `backup.sql`
- **Latência**: Neon São Paulo tem ~20-50ms de latência, aceitável para a aplicação
