import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  // Se estivermos rodando no Vite dev server (porta 5173), aponta para o backend (porta 3001)
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}:3001`;
  }
  // Em produção ou servido pelo Express, usa a mesma origem
  return window.location.origin;
};

export const socket: Socket = io(getSocketUrl(), {
  autoConnect: true,
  transports: ['websocket', 'polling'],
});
