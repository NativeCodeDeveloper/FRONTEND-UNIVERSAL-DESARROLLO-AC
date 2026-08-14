
export default function estadoCabecera({estado}) {

    if(estado === 1){
        return(

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                </span>
                Pasarela activas
            </div>
        )
    }


    if(estado === 0 || estado === "0"){
        return(

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                                </span>
                Pasarela inactivas
            </div>
        )
    }



    if(estado === null || estado === undefined){
        return(

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gray-400 opacity-70" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gray-500" />
                                </span>
                Estado Desconocido
            </div>
        )
    }


}