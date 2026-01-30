"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";

type ServiceStatus = "loading" | "online" | "offline";

interface LogEntry {
  id: string;
  timestamp: Date;
  type: "estoquista" | "aprendiz" | "alerta" | "erro" | "info" | "sucesso";
  message: string;
  loja?: string;
  detalhes?: string;
}

interface Toast {
  id: string;
  type: "sucesso" | "alerta" | "erro" | "info";
  title: string;
  message: string;
  loja?: string;
}

const SHEETS_URL = "https://docs.google.com/spreadsheets/d/1W8gZqAU6GFdNon-xbKQ8ndUcFLVz9cDSWrnL_CVR_XQ";

// Gerar ID único sem crypto.randomUUID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function Home() {
  const [status, setStatus] = useState<ServiceStatus>("loading");
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  // Adicionar toast
  const addToast = useCallback((type: Toast["type"], title: string, message: string, loja?: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, type, title, message, loja }]);

    // Auto-remover após 5 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Adicionar log
  const addLog = useCallback((type: LogEntry["type"], message: string, loja?: string, detalhes?: string) => {
    setLogs((prev) => [
      {
        id: generateId(),
        timestamp: new Date(),
        type,
        message,
        loja,
        detalhes,
      },
      ...prev.slice(0, 99),
    ]);
  }, []);

  // Buscar eventos do backend
  const fetchEvents = useCallback(async () => {
    try {
      const url = lastEventId
        ? `/api/events?after=${lastEventId}`
        : '/api/events';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          data.events.forEach((event: { id: string; type: string; title: string; message: string; loja?: string; detalhes?: string }) => {
            // Adicionar toast
            addToast(
              event.type as Toast["type"],
              event.title,
              event.message,
              event.loja
            );
            // Adicionar ao log
            addLog(
              event.type as LogEntry["type"],
              `${event.title}: ${event.message}`,
              event.loja,
              event.detalhes
            );
          });
          // Atualizar último ID
          setLastEventId(data.events[data.events.length - 1].id);
        }
      }
    } catch {
      // Silenciar erros de polling
    }
  }, [lastEventId, addToast, addLog]);

  const checkHealth = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    }
    setLastCheck(new Date());
  };

  useEffect(() => {
    checkHealth();
    addLog("info", "Sistema iniciado", undefined, "Monitoramento de webhooks ativo");

    // Health check a cada 30s
    const healthInterval = setInterval(checkHealth, 30000);

    // Buscar eventos a cada 3s
    const eventsInterval = setInterval(fetchEvents, 3000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(eventsInterval);
    };
  }, [addLog, fetchEvents]);

  const statusConfig = {
    loading: {
      color: "bg-yellow-500",
      pulse: "animate-pulse",
      text: "Verificando...",
      textColor: "text-yellow-400",
    },
    online: {
      color: "bg-emerald-500",
      pulse: "animate-pulse",
      text: "Online",
      textColor: "text-emerald-400",
    },
    offline: {
      color: "bg-red-500",
      pulse: "",
      text: "Offline",
      textColor: "text-red-400",
    },
  };

  const currentStatus = statusConfig[status];

  const logTypeConfig = {
    estoquista: { color: "bg-blue-500", label: "EST", icon: "📦" },
    aprendiz: { color: "bg-purple-500", label: "APR", icon: "👤" },
    alerta: { color: "bg-orange-500", label: "ALT", icon: "⚠️" },
    erro: { color: "bg-red-500", label: "ERR", icon: "❌" },
    info: { color: "bg-zinc-500", label: "INF", icon: "ℹ️" },
    sucesso: { color: "bg-emerald-500", label: "OK", icon: "✅" },
  };

  const toastConfig = {
    sucesso: {
      bg: "bg-emerald-900/90 border-emerald-500",
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    alerta: {
      bg: "bg-orange-900/90 border-orange-500",
      icon: (
        <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    erro: {
      bg: "bg-red-900/90 border-red-500",
      icon: (
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    info: {
      bg: "bg-blue-900/90 border-blue-500",
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex min-h-screen items-center justify-center  font-sans p-4">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${toastConfig[toast.type].bg} border-l-4 rounded-lg p-4 shadow-2xl backdrop-blur-sm animate-slide-in`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {toastConfig[toast.type].icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                <p className="text-sm text-zinc-300 mt-1">{toast.message}</p>
                {toast.loja && (
                  <p className="text-xs text-zinc-400 mt-1">📍 {toast.loja}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <main className="flex flex-col items-center gap-8 w-full max-w-5xl">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Image src="/logo.png" alt="Checklist Fácil" width={300} height={200} />
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Status Card */}
          <div className="flex flex-col items-center gap-8 rounded-3xl border border-zinc-700 p-10 shadow-xl bg-zinc-900">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl text-center">
              API Checklist Fácil
            </h1>

            {/* Status Indicator */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div
                  className={`absolute h-24 w-24 rounded-full ${currentStatus.color} ${currentStatus.pulse} opacity-20`}
                />
                <div
                  className={`absolute h-20 w-20 rounded-full ${currentStatus.color} ${currentStatus.pulse} opacity-30`}
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full ${currentStatus.color} shadow-lg`}
                >
                  {status === "online" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-white">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                    </svg>
                  )}
                  {status === "offline" && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-white">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  )}
                  {status === "loading" && (
                    <svg className="h-8 w-8 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className={`text-xl font-semibold ${currentStatus.textColor}`}>
                  {currentStatus.text}
                </span>
                <span className="text-sm text-zinc-400">
                  {status === "online" ? "Todos os sistemas operacionais" : status === "offline" ? "Serviço indisponível" : "Aguarde..."}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex w-full flex-col gap-3 border-t border-zinc-700 pt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Última verificação</span>
                <span className="font-medium text-zinc-300">
                  {lastCheck ? lastCheck.toLocaleTimeString("pt-BR") : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Intervalo</span>
                <span className="font-medium text-zinc-300">30 segundos</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={checkHealth}
                disabled={status === "loading"}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 ${status === "loading" ? "animate-spin" : ""}`}>
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                </svg>
                Verificar
              </button>
              <a
                href={SHEETS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l4.122 4.12A1.5 1.5 0 0117 7.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13z" />
                </svg>
                Ver Planilha
              </a>
            </div>
          </div>

          {/* Log Card */}
          <div className="flex flex-col rounded-3xl border border-zinc-700 p-6 shadow-xl bg-zinc-900 max-h-[520px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Log de Atividades
              </h2>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
              >
                Limpar
              </button>
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">Aguardando atividades...</p>
                  <p className="text-xs mt-1 text-zinc-600">Os eventos aparecerão aqui em tempo real</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors border border-zinc-800"
                  >
                    <span className="text-lg">{logTypeConfig[log.type].icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">{log.message}</p>
                      {log.detalhes && (
                        <p className="text-xs text-zinc-500 mt-1">{log.detalhes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-zinc-500">
                          {log.timestamp.toLocaleTimeString("pt-BR")}
                        </span>
                        {log.loja && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                              {log.loja}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Log Footer */}
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{logs.length} registro{logs.length !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Atualização automática
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600">
          Sistema de integração com Checklist Fácil • Grupo Do Nô
        </p>
      </main>

      {/* CSS for toast animation */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
