import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Upsert default species
    const species = await prisma.species.upsert({
        where: { nome_cientifico: 'Unknown' },
        update: {},
        create: {
            nome_cientifico: 'Unknown',
            nome_comum: 'Desconhecida',
        },
    })
    console.log({ species })

    // Create default Admin
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@treeinspector.com' },
        update: {},
        create: {
            email: 'admin@treeinspector.com',
            name: 'Administrador',
            password: hashedPassword,
            role: 'ADMIN',
            active: true
        }
    })
    console.log({ admin: admin.email })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
