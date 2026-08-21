"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getDashboardRoleFromUser, getDashboardRoleLabel } from "@/lib/dashboard-access";

export default function UserMenu() {
    const { user, isLoaded } = useUser();
    const { signOut, openUserProfile } = useClerk();
    const [empresaNombre, setEmpresaNombre] = useState("");

    useEffect(() => {
        const API = process.env.NEXT_PUBLIC_API_URL;
        if (!API) return;
        fetch(`${API}/datosempresa/seleccionartodos`, {
            method: "GET",
            headers: { Accept: "application/json" },
            mode: "cors",
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data) return;
                const d = Array.isArray(data) ? data[0] : data;
                if (d?.empresaNombre) setEmpresaNombre(d.empresaNombre);
            })
            .catch(() => {});
    }, []);

    if (!isLoaded) {
        return (
            <div className="shrink-0 px-4 pb-0 pt-5">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-24 w-24 animate-pulse rounded-full bg-slate-100" />
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
            </div>
        );
    }

    const name = user?.fullName || user?.firstName || "Usuario";
    const role = getDashboardRoleFromUser(user);
    const roleLabel = getDashboardRoleLabel(role);
    const avatar = user?.imageUrl;

    if (!user) {
        return (
            <div className="shrink-0 px-4 pb-0 pt-5">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EDE9FE] text-[#6E56CF] ring-2 ring-violet-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.105.895-2 2-2s2 .895 2 2v1m-7 0V9a3 3 0 016 0m-8 3h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" />
                        </svg>
                    </div>
                    <div className="min-w-0 w-full">
                        <p className="truncate text-[14px] font-semibold leading-tight text-slate-800">
                            Acceso temporal
                        </p>
                        <p className="mt-1 truncate text-[11px] leading-tight text-slate-400">
                            Dashboard sin autenticación
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="shrink-0 px-4 pb-0 pt-5">
            <details className="group">
                <summary className="relative flex cursor-pointer list-none select-none flex-col items-center gap-1.5 px-2 pb-1 pt-1 [&::-webkit-details-marker]:hidden">

                    {/* Avatar */}
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#EDE9FE] shadow-lg ring-2 ring-violet-100 transition-transform duration-200 group-hover:scale-[1.03]">
                        {avatar ? (
                            <img src={avatar} alt={name} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-xl font-bold text-[#6E56CF]">{name.charAt(0)}</span>
                        )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 w-full px-1 text-center">
                        <p className="break-words text-[15px] font-semibold leading-snug text-slate-800">
                            {name}
                        </p>
                        <p className="mt-1 break-words text-[11px] font-medium capitalize leading-snug text-[#6E56CF]">
                            {roleLabel}
                        </p>
                        {empresaNombre && (
                            <p className="mt-2 break-words text-[9px] font-semibold uppercase leading-snug tracking-[0.08em] text-slate-400">
                                {empresaNombre}
                            </p>
                        )}
                    </div>

                    {/* Chevron */}
                    <svg
                        className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>

                {/* Dropdown */}
                <div className="mt-1 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <button
                        type="button"
                        onClick={() => openUserProfile()}
                        className="flex w-full items-center gap-2.5 border-b border-slate-100 px-4 py-3 text-[12px] font-medium text-slate-600 transition-all hover:bg-violet-50 hover:text-[#6E56CF]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span>Editar perfil</span>
                    </button>
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 px-4 py-3 text-[12px] font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-[#6E56CF] border-b border-slate-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Volver a página web</span>
                    </Link>

                    <button
                        onClick={() => signOut({ redirectUrl: "/sign-in" })}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-[12px] font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </details>
        </div>
    );
}
