const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.user.count();
        const admin = await prisma.user.findUnique({ where: { email: 'admin@treeinspector.com' } });
        console.log('Total users:', count);
        console.log('Admin user exists:', !!admin);
        if (admin) console.log('Admin active:', admin.active);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
