const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function verify() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No user found');
            return;
        }

        console.log('Original Password Hash:', user.password);

        const newPassword = 'test-password-123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
        console.log('Updated Password Hash:', updatedUser.password);

        if (updatedUser.password !== user.password) {
            console.log('SUCCESS: Password hash changed in database');
        } else {
            console.log('FAILURE: Password hash DID NOT change');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
