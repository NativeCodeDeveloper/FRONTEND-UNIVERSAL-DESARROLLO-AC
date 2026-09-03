import { Star } from "lucide-react";

export default function TestimonialCard({
                                            nombre,
                                            puntuacion = 5,
                                            servicio,
                                            comentario,
                                        }) {
    return (
        <div className="h-full bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-between transition-all hover:shadow-xl">

            {/* Rating */}
            <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    strokeWidth={1.5}
                    color={i < puntuacion ? "#facc15" : "#fde68a"}
                    fill={i < puntuacion ? "#facc15" : "#fde68a"}
                    className={i < puntuacion ? "" : "opacity-70"}
                  />
                ))}
            </div>

            {/* Comentario */}
            <p className="text-gray-600 text-lg italic leading-relaxed mb-8 line-clamp-6">
                “{comentario}”
            </p>

            {/* Footer */}
            <div className="flex items-center gap-4">
                <svg width="32" height="29" viewBox="0 0 44 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M33.172 5.469q2.555 0 4.547 1.547a7.4 7.4 0 0 1 2.695 4.007q.47 1.711.469 3.61 0 2.883-1.125 5.86a22.8 22.8 0 0 1-3.094 5.577 33 33 0 0 1-4.57 4.922A35 35 0 0 1 26.539 35l-3.398-3.398q5.296-4.243 7.218-6.563 1.946-2.32 2.016-4.617-2.86-.329-4.781-2.461-1.923-2.133-1.922-4.992 0-3.117 2.18-5.297 2.202-2.203 5.32-2.203m-20.625 0q2.555 0 4.547 1.547a7.4 7.4 0 0 1 2.695 4.007q.47 1.711.469 3.61 0 2.883-1.125 5.86a22.8 22.8 0 0 1-3.094 5.577 33 33 0 0 1-4.57 4.922A35 35 0 0 1 5.914 35l-3.398-3.398q5.296-4.243 7.218-6.563 1.946-2.32 2.016-4.617-2.86-.329-4.781-2.461-1.922-2.133-1.922-4.992 0-3.117 2.18-5.297 2.202-2.203 5.32-2.203" fill="#2563EB"/>
                </svg>

                <div>
                    <p className="font-semibold text-gray-900">{nombre}</p>
                    <p className="text-sm text-gray-500">{servicio}</p>
                </div>
            </div>
        </div>
    );
}