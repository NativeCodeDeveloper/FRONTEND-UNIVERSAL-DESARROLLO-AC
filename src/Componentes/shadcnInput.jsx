import { Input } from "@/components/ui/input"

export function ShadcnInput({placeholder, value, onChange, className, readOnly= false}) {

    return <Input onChange={onChange} value={value} type="text" placeholder={placeholder} className={className} readOnly={readOnly || false} />
}
