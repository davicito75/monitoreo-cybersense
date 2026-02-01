import prisma from '../../src/db/client';

async function main() {
  const monitors = await prisma.monitor.findMany({ include: { checks: { orderBy: { createdAt: 'desc' }, take: 5 } } });
  for (const m of monitors) {
    console.log('--- Monitor', m.id, m.name, m.type);
    if (!m.checks || m.checks.length === 0) {
      console.log('  no checks');
      continue;
    }
    for (const c of m.checks) {
      console.log('  check', c.id, c.status, 'latency:', c.latencyMs, 'error:', c.error, 'at', c.createdAt.toISOString());
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
