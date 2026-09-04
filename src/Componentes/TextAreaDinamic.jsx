import { cn } from "@/lib/utils";

export function TextAreaDinamic({ className, value, onChange, onClick, placeholder, maxLength }) {
    return (
        <textarea
            value={value}
            onChange={onChange}
            onClick={onClick}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={5}
            className={cn(
                "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm transition-all outline-none resize-y",
                "focus:border-gray-900 focus:ring-2 focus:ring-gray-900/20",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "whitespace-pre-wrap",
                className
            )}
        />
    );
}
