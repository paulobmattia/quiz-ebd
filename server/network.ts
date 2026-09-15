import os from 'os';

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (netList) {
      for (const net of netList) {
        // Ignora endereços internos (127.0.0.1) e IPv6
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  }
  return 'localhost';
}
