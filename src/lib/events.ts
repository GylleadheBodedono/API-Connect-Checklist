// Armazenamento de eventos em memória para notificações em tempo real
// Nota: Em ambiente serverless, eventos são perdidos entre cold starts

export interface Event {
  id: string;
  timestamp: Date;
  type: "sucesso" | "alerta" | "erro" | "info";
  title: string;
  message: string;
  loja?: string;
  detalhes?: string;
}

// Array global para armazenar eventos (máximo 100)
const events: Event[] = [];
let eventCounter = 0;

export function addEvent(
  type: Event["type"],
  title: string,
  message: string,
  loja?: string,
  detalhes?: string
): Event {
  const event: Event = {
    id: `evt-${Date.now()}-${++eventCounter}`,
    timestamp: new Date(),
    type,
    title,
    message,
    loja,
    detalhes,
  };

  events.unshift(event);

  // Manter apenas os últimos 100 eventos
  if (events.length > 100) {
    events.pop();
  }

  console.log(`[EVENT] ${type.toUpperCase()}: ${title} - ${message}${loja ? ` (${loja})` : ''}`);

  return event;
}

export function getEvents(afterId?: string): Event[] {
  if (!afterId) {
    return events.slice(0, 20); // Retornar últimos 20 eventos
  }

  // Encontrar índice do evento após o ID fornecido
  const index = events.findIndex((e) => e.id === afterId);
  if (index === -1) {
    return events.slice(0, 20);
  }

  // Retornar eventos mais recentes que o ID fornecido
  return events.slice(0, index);
}

export function clearEvents(): void {
  events.length = 0;
  eventCounter = 0;
}
