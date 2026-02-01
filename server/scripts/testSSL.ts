import prisma from '../src/db/client';
import { httpCheck } from '../src/services/checks';

async function main() {
  try {
    // Get all monitors
    const monitors = await prisma.monitor.findMany();
    
    console.log(`Found ${monitors.length} monitors\n`);
    
    // Test only HTTP/HTTPS monitors
    const httpMonitors = monitors.filter(m => m.type.toUpperCase() === 'HTTP');
    
    for (const monitor of httpMonitors) {
      console.log(`Testing: ${monitor.name} (${monitor.urlOrHost})`);
      
      try {
        const result = await httpCheck(monitor.urlOrHost, monitor.timeoutMs, monitor.expectedStatus || undefined, monitor.contentRegex || undefined);
        
        console.log(`  Status: ${result.status}`);
        console.log(`  Latency: ${result.latencyMs}ms`);
        if (result.sslCertExpiry) {
          console.log(`  SSL Expires: ${result.sslCertExpiry}`);
          console.log(`  Days Until Expiry: ${result.sslDaysUntilExpiry}`);
          console.log(`  SSL Issuer: ${result.sslIssuer}`);
          console.log(`  SSL Valid: ${result.sslValid}`);
          
          // Update monitor with SSL info
          await prisma.monitor.update({
            where: { id: monitor.id },
            data: {
              sslCertExpiry: result.sslCertExpiry,
              sslDaysUntilExpiry: result.sslDaysUntilExpiry,
              sslIssuer: result.sslIssuer,
              sslValid: result.sslValid
            }
          });
          console.log(`  ✅ Updated monitor with SSL info\n`);
        } else {
          console.log(`  No SSL info available (not HTTPS?)\n`);
        }
      } catch (error: any) {
        console.log(`  Error: ${error.message}\n`);
      }
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
