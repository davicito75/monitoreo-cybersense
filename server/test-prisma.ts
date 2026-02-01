import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    try {
        await prisma.$connect()
        console.log('CONEXION EXITOSA!')
        const count = await prisma.user.count()
        console.log('Usuarios encontrados:', count)
    } catch (e) {
        console.error('ERROR CONEXION:', e)
    } finally {
        await prisma.$disconnect()
    }
}
main()
