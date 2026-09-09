import os from 'os';

export function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // Pular endereços internos (127.0.0.1) e IPv6
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          address: net.address,
        });
      }
    }
  }

  return addresses;
}

export function printNetworkBanner(port) {
  const ips = getLocalIpAddresses();
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀  PLANNER DE EQUIPE - SERVIDOR EM TEMPO REAL INICIADO');
  console.log('='.repeat(60));
  console.log(`\n📌  No SEU Computador (Host):`);
  console.log(`    👉 http://localhost:${port}`);
  
  if (ips.length > 0) {
    console.log(`\n👥  Para os seus COLEGAS DE TRABALHO acessarem:`);
    ips.forEach((item) => {
      console.log(`    👉 http://${item.address}:${port}  (Rede: ${item.interface})`);
    });
    console.log(`\n💡 Dica: Basta enviar o link acima para seus colegas no WhatsApp, Teams ou Slack.`);
    console.log(`   Eles só precisam abrir no navegador (sem instalar nada).`);
  } else {
    console.log(`\n⚠️  Nenhum endereço de rede local detectado. Conecte-se ao Wi-Fi ou cabo de rede.`);
  }
  console.log('='.repeat(60) + '\n');
}
