const { exec } = require('child_process');
const fs = require('fs');

console.log('Generating SQL...');
exec('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { cwd: './server' }, (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stderr: ${stderr}`);
        return;
    }
    fs.writeFileSync('server/migration.sql', stdout);
    console.log('Migration generated in server/migration.sql');
});
