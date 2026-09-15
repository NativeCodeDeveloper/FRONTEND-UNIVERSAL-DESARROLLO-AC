"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Minus, Send, X } from "lucide-react";
import { useTour } from "@/ContextosGlobales/TourContext";

const InteractiveNebulaOrb = dynamic(
  () => import("@/components/ui/InteractiveNebulaOrb").then((module) => module.InteractiveNebulaOrb),
  {
    ssr: false,
    loading: () => <span className="block h-full w-full rounded-full bg-transparent" />,
  },
);

const MAX_CHARS = 2000;
const THINKING_LABELS = [
  "haciendo sinapsis...",
  "propagacion neuronal...",
  "mielinizando...",
  "realizando cognicion...",
];

export default function CortexAssistant() {
  const { isRunning: tourActivo } = useTour();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mockConversation, setMockConversation] = useState([]);
  const [isEvolving, setIsEvolving] = useState(false);
  const [thinkingLabelIndex, setThinkingLabelIndex] = useState(0);
  const inputRef = useRef(null);
  const conversationEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mockConversation]);

  useEffect(() => {
    if (!isEvolving) return undefined;

    setThinkingLabelIndex(0);

    const labelTimer = window.setInterval(() => {
      setThinkingLabelIndex((current) => (current + 1) % THINKING_LABELS.length);
    }, 1500);

    const responseTimer = window.setTimeout(() => {
      setMockConversation((current) => [
        ...current,
        {
          role: "cortex",
          type: "capabilities",
        },
      ]);
      setIsEvolving(false);
      inputRef.current?.focus();
    }, 4000);

    return () => {
      window.clearInterval(labelTimer);
      window.clearTimeout(responseTimer);
    };
  }, [isEvolving]);

  const isNearLimit = message.length > MAX_CHARS * 0.85;

  const handleSubmit = (event) => {
    event.preventDefault();

    const userMessage = message.trim();
    if (!userMessage || isEvolving) return;

    setMockConversation((current) => [
      ...current,
      { role: "user", content: userMessage },
    ]);
    setMessage("");
    setIsEvolving(true);
  };

  // Igual que el banner de notificaciones: z-[80] queda por debajo del overlay
  // del tour (z-10000), así que durante el tutorial el orbe se vería como una
  // mancha apagada en la esquina. Se oculta y vuelve al terminar.
  if (tourActivo) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <div className="absolute bottom-5 right-4 flex flex-col items-end sm:bottom-7 sm:right-7">
        {isOpen ? (
          <section
            id="cortex-assistant-dialog"
            role="dialog"
            aria-modal="false"
            aria-labelledby="cortex-assistant-title"
            className="pointer-events-auto flex h-[min(460px,calc(100vh-96px))] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#28282a]/95 shadow-[0_32px_72px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:w-[360px]"
          >
            <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div
                  className="relative h-14 w-14 rounded-full bg-transparent"
                  style={{
                    maskImage: "radial-gradient(circle, black 52%, transparent 72%)",
                    WebkitMaskImage: "radial-gradient(circle, black 52%, transparent 72%)",
                  }}
                >
                  <InteractiveNebulaOrb
                    isThinking={isEvolving}
                    className="absolute inset-0 h-full w-full rounded-full"
                  />
                </div>
                <div>
                  <h2
                    id="cortex-assistant-title"
                    className="text-[13px] font-bold tracking-[0.18em] text-white antialiased"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    CORTEX A.I
                  </h2>
                  <p
                    className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-white/30 antialiased"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    Agente Inteligencia Artificial
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Minimizar CORTEX A.I"
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/80 focus:outline-none"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar CORTEX A.I"
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white/80 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto bg-black/20 px-4 py-5"
            >
              <div className="max-w-[86%] break-words rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.07] px-4 py-3 text-[13px] leading-relaxed text-white/80 shadow-sm">
                Hola, soy el agente de IA de AgendaClínica. Haré todo el trabajo por ti, solo pídemelo.
              </div>

              {mockConversation.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`w-fit max-w-[86%] break-words rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                    item.role === "user"
                      ? "ml-auto rounded-tr-sm border border-violet-900/30 bg-[#21183D] text-white"
                      : "rounded-tl-sm border border-white/[0.08] bg-white/[0.07] text-white/80"
                  }`}
                >
                  {item.type === "capabilities" ? (
                    <div>
                      <p>De momento no estoy disponible en este plan, pero puedo:</p>
                      <ul className="mt-2.5 space-y-1.5 pl-4 text-left [list-style-type:disc] marker:text-violet-400">
                        <li>Agendar pacientes por ti.</li>
                        <li>Mejorar la redacción de tus fichas.</li>
                        <li>Realizar bloqueos específicos.</li>
                        <li>Responder tus dudas sobre la aplicación.</li>
                        <li>Enviar recordatorios y correos.</li>
                        <li>Entregarte reportes de tus agendas.</li>
                        <li>Generar resúmenes diagnósticos.</li>
                        <li>Y mucho más.</li>
                      </ul>
                      <p className="mt-3 border-t border-white/10 pt-3 font-semibold text-white/90">
                        Para usarme, adquiere el plan MAX 🔥 de Agenda Clínica.
                      </p>
                    </div>
                  ) : (
                    item.content
                  )}
                </div>
              ))}
              {isEvolving && (
                <div
                  className="w-fit px-1 py-2"
                  style={{ backgroundColor: "transparent" }}
                  aria-label="CORTEX A.I esta pensando"
                >
                  <svg
                    className="h-8 w-72 overflow-visible"
                    viewBox="0 0 330 42"
                    fill="none"
                    role="img"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 22H24L30 14L38 22H52L61 22L66 6L72 38L79 22H102L111 22L117 13L125 22H139L148 22L153 5L159 37L166 22H178"
                      className="cortex-heartbeat-trail"
                    />
                    <path
                      d="M2 22H24L30 14L38 22H52L61 22L66 6L72 38L79 22H102L111 22L117 13L125 22H139L148 22L153 5L159 37L166 22H178"
                      className="cortex-heartbeat-line"
                    />
                    <text x="204" y="25" className="cortex-synapse-word">
                      {THINKING_LABELS[thinkingLabelIndex]}
                    </text>
                  </svg>
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>

            <footer className="border-t border-white/[0.06] p-3">
              <form
                onSubmit={handleSubmit}
                className={`cortex-input-aura relative isolate flex items-end gap-2 rounded-xl border border-white/[0.08] bg-white/[0.06] p-1.5 pl-3 transition ${
                  isEvolving ? "is-thinking" : ""
                }`}
              >
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
                  maxLength={MAX_CHARS}
                  disabled={isEvolving}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  aria-label="Mensaje para CORTEX A.I"
                  placeholder={isEvolving ? "CORTEX esta respondiendo..." : "Escribe un mensaje..."}
                  className="max-h-24 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-[13px] leading-5 text-white/80 outline-none placeholder:text-white/25"
                />
                <div className="flex shrink-0 flex-col items-end gap-1.5 pb-0.5">
                  <span
                    className={`font-mono text-[9px] tabular-nums transition-colors ${
                      isNearLimit ? "text-amber-400" : "text-slate-600"
                    }`}
                  >
                    {message.length}/{MAX_CHARS}
                  </span>
                  <button
                    type="submit"
                    aria-label="Enviar mensaje"
                    disabled={!message.trim() || isEvolving}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-[#21183D] text-white transition hover:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
              <div className="mt-2 flex items-center justify-between px-0.5">
                <p className="text-[9px] text-white/25">Shift + Enter para nueva línea</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[9px] text-white/25">Todos los sistemas operativos</span>
                </div>
              </div>
            </footer>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir CORTEX A.I"
            aria-expanded={isOpen}
            aria-controls="cortex-assistant-dialog"
            className="pointer-events-auto rounded-full bg-transparent p-0 shadow-none transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-200/60"
          >
            <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-transparent">
              <InteractiveNebulaOrb isThinking={isEvolving} className="h-full w-full" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
