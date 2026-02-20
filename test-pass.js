const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const email = 'admin@treeinspector.com';
    const password = 'admin123';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found');
        return;
    }

    const match = await bcrypt.compare(password, user.password);
    console.log('Password match:', match);

    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash match:', await bcrypt.compare(password, newHash));
}

test();
