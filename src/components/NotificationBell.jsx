'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Bell, BellOff, CalendarCheck, CalendarX, Clock, Activity, X, CheckCheck } from 'lucide-react';
import { useNotificaciones } from '@/hooks/useNotificaciones';

function getNotifStyle(tipo) {
    if (tipo === 'cita_nueva')     return { Icon: CalendarCheck, bg: 'bg-emerald-50',  color: 'text-emerald-600' };
    if (tipo === 'cita_estado')    return { Icon: Activity,       bg: 'bg-sky-50',      color: 'text-sky-600'     };
    if (tipo === 'cita_cancelada') return { Icon: CalendarX,      bg: 'bg-red-50',      color: 'text-red-500'     };
    if (tipo === 'recordatorio')   return { Icon: Clock,          bg: 'bg-violet-50',   color: 'text-[#6E56CF]'   };
    return { Icon: Bell, bg: 'bg-slate-100', color: 'text-slate-500' };
}

function formatRelativo(fecha) {
    const diff = Date.now() - new Date(fecha).getTime();
    const min  = Math.floor(diff / 60000);
    if (min < 1)  return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24)   return `hace ${h}h`;
    return `hace ${Math.floor(h / 24)} días`;
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [pos,  setPos]  = useState({ top: 0, left: 0, maxH: 400 });
    const btnRef = useRef(null);
    const router = useRouter();
    const { notifs, permiso, pedirPermiso, marcarLeida, marcarTodasLeidas } = useNotificaciones();

    function irACitaDeNotificacion(notif) {
        if (notif.tipo !== 'recordatorio' || !notif.id_reserva) return;
        setOpen(false);
        router.push(`/dashboard/calendario?id_reserva=${notif.id_reserva}`);
    }

    const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

    const calcPos = useCallback(() => {
        if (!btnRef.current) return;
        if (isMobile()) { setPos({ mobile: true, maxH: window.innerHeight * 0.75 }); return; }
        const r   = btnRef.current.getBoundingClientRect();
        const w   = 320;
        const gap = 8;

        // Horizontal: derecha si cabe, si no izquierda
        const leftRight = r.right + gap;
        const left = leftRight + w + 8 <= window.innerWidth
            ? leftRight
            : Math.max(8, r.left - w - gap);

        // Vertical: si el botón está en la mitad inferior, el panel sube
        const nearBottom = r.top > window.innerHeight / 2;
        if (nearBottom) {
            const maxH = Math.min(420, r.bottom - 16);
            setPos({ mobile: false, bottom: window.innerHeight - r.bottom, left, maxH });
        } else {
            const maxH = Math.max(200, window.innerHeight - r.top - 16);
            setPos({ mobile: false, top: r.top, left, maxH });
        }
    }, []);

    function toggle() { calcPos(); setOpen(o => !o); }

    // Ya no se marcan leídas solo por abrir el panel — desaparecen cuando pasa
    // la hora de la cita, o si el usuario las descarta explícitamente (X / "marcar todas").

    // Cerrar al hacer clic fuera
    useEffect(() => {
        if (!open) return;
        function onDown(e) {
            const panel = document.getElementById('ac-notif-panel');
            if (btnRef.current?.contains(e.target)) return;
            if (panel?.contains(e.target)) return;
            setOpen(false);
        }
        document.addEventListener('mousedown', onDown);
        window.addEventListener('resize', calcPos);
        return () => {
            document.removeEventListener('mousedown', onDown);
            window.removeEventListener('resize', calcPos);
        };
    }, [open, calcPos]);

    const panelStyle = pos.mobile
        ? { position: 'fixed', bottom: 0, left: 0, right: 0, width: '100%', maxHeight: pos.maxH, zIndex: 9999, borderRadius: '20px 20px 0 0' }
        : pos.bottom !== undefined
            ? { position: 'fixed', bottom: pos.bottom, left: pos.left, width: 320, zIndex: 9999 }
            : { position: 'fixed', top: pos.top, left: pos.left, width: 320, zIndex: 9999 };

    const panel = open && typeof document !== 'undefined' && createPortal(
        <>
            {pos.mobile && (
                <div className="fixed inset-0 bg-black/20 z-[9998]" onClick={() => setOpen(false)} />
            )}
            <div
                id="ac-notif-panel"
                style={panelStyle}
                className="rounded-[22px] bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_24px_70px_-16px_rgba(15,23,42,0.28)] flex flex-col overflow-hidden"
            >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold tracking-tight text-slate-900">Notificaciones</span>
                    {notifs.length > 0 && (
                        <span className="text-[10px] bg-[#EDE9FE] text-[#6E56CF] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
                            {notifs.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-0.5">
                    {notifs.length > 0 && (
                        <button onClick={marcarTodasLeidas} title="Descartar todas"
                            className="p-1.5 text-slate-400 hover:text-[#6E56CF] transition-colors rounded-full hover:bg-slate-100">
                            <CheckCheck size={14} strokeWidth={2} />
                        </button>
                    )}
                    <button onClick={() => setOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                        <X size={14} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {/* Banner push si no tiene permiso */}
            {permiso === 'default' && (
                <div className="mx-3 mb-2 px-3.5 py-3 rounded-2xl bg-[#F6F4FE] shrink-0">
                    <p className="text-[11.5px] text-slate-600 leading-relaxed mb-2">
                        Activa las notificaciones para recibir avisos aunque no estés en la plataforma.
                    </p>
                    <button onClick={pedirPermiso}
                        className="text-[11.5px] bg-[#6E56CF] hover:bg-[#5b45bc] text-white px-3 py-1.5 rounded-full transition-colors font-semibold">
                        Activar notificaciones
                    </button>
                </div>
            )}
            {permiso === 'denied' && (
                <div className="mx-3 mb-2 px-3.5 py-2.5 rounded-2xl bg-red-50 flex items-center gap-2 shrink-0">
                    <BellOff size={12} className="text-red-400 shrink-0" />
                    <p className="text-[11px] text-red-500">Notificaciones bloqueadas en el navegador.</p>
                </div>
            )}

            {/* Lista — tarjetas apiladas, sin separadores duros */}
            <div className="overflow-y-auto px-2 pb-2 space-y-1" style={{ maxHeight: (pos.maxH || 400) - 60 }}>
                {notifs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2.5">
                        <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center">
                            <Bell size={17} className="text-slate-300" strokeWidth={1.8} />
                        </div>
                        <p className="text-[12px] text-slate-400">Sin notificaciones pendientes</p>
                    </div>
                ) : (
                    notifs.map(n => {
                        const { Icon, bg, color } = getNotifStyle(n.tipo);
                        const clicable = n.tipo === 'recordatorio' && n.id_reserva;
                        return (
                            <div key={n.id}
                                onClick={() => irACitaDeNotificacion(n)}
                                title={clicable ? 'Ver cita en el calendario' : undefined}
                                className={`group relative flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors duration-150 hover:bg-slate-50 ${clicable ? 'cursor-pointer' : ''}`}>
                                <div className={`w-9 h-9 rounded-[13px] ${bg} flex items-center justify-center shrink-0`}>
                                    <Icon size={15} className={color} strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="text-[12.5px] font-semibold text-slate-800 truncate leading-tight">{n.titulo}</p>
                                        <span className="text-[10px] text-slate-400 shrink-0">{formatRelativo(n.creado_en)}</span>
                                    </div>
                                    {n.descripcion && (
                                        <p className="text-[11.5px] text-slate-500 truncate mt-1 leading-snug">{n.descripcion}</p>
                                    )}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); marcarLeida(n.id); }} title="Descartar"
                                    className="absolute top-2.5 right-2.5 p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                    <X size={12} strokeWidth={2} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
        </>,
        document.body
    );

    return (
        <>
            <button ref={btnRef} onClick={toggle} title="Notificaciones"
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all duration-150 ${
                    open ? 'bg-[#EDE9FE] text-[#6E56CF]' : 'bg-slate-100/80 text-slate-400 hover:bg-[#F3F0FF] hover:text-[#6E56CF]'
                }`}>
                <Bell size={15} strokeWidth={1.8} />
                {notifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#6E56CF] rounded-full flex items-center justify-center text-[8px] font-bold text-white leading-none ring-2 ring-white">
                        {notifs.length > 9 ? '9+' : notifs.length}
                    </span>
                )}
            </button>
            {panel}
        </>
    );
}
