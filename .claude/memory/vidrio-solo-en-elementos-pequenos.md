---
name: vidrio-solo-en-elementos-pequenos
description: El glassmorphism va solo en elementos pequeños (pastillas, eventos, sidebar); no en paneles/formularios grandes
metadata:
  type: feedback
---

Al usuario le gustó el toque de vidrio (`.vidrio-toque`) en pastillas de estado, botones y eventos del calendario, pero **rechazó** aplicarlo al panel del drawer de agendamiento (`AppointmentDrawer.jsx`): "REVIÉRTELO NO ME GUSTÓ" (26-10-2026).

**Why:** En superficies grandes (paneles laterales, modales, formularios) el blanco translúcido + blur resiente la legibilidad y se ve "agua"; en elementos pequeños comunica profundidad sin costo.

**How to apply:** Efectos de vidrio (`backdrop-blur`, fondos `/75`, brillos internos) solo en elementos compactos: pastillas de estado, botones, tarjetas de eventos. Paneles y formularios quedan con fondo sólido (`bg-white`). Si se pide "glassmorphism" en algo grande, confirmar alcance antes de aplicarlo.
