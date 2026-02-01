import { httpCheck, tcpCheck } from '../src/services/checks';

async function run() {
  console.log('Testing httpCheck against https://example.com');
  const h = await httpCheck('https://example.com', 5000, 200);
  console.log('httpCheck result', h);

  console.log('Testing tcpCheck to example.com:443');
  const t = await tcpCheck('example.com', 443, 3000);
  console.log('tcpCheck result', t);
}

run().catch((e) => { console.error(e); process.exit(1); });
