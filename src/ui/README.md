# 🧱 Módulo `ui` (Primitivas UI)

Componentes visuales puros y agnósticos en React sin dependencias externas CSS.

---

## 🏷️ Etiqueta de Estado (`Badge`)

```tsx
import { Badge } from '../../common-utils';

<Badge variant="success">Completado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="danger" showDot={false}>Error</Badge>
```

---

## 🪟 Ventana Modal (`Modal`)

```tsx
import { useState } from 'react';
import { Modal } from '../../common-utils';

function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir Modal</button>
      
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Título del Modal">
        <p>Contenido del modal...</p>
      </Modal>
    </>
  );
}
```

---

## 🔔 Sistema de Notificaciones (`ToastProvider`, `useToast`, `notify`)

Permite mostrar notificaciones flotantes modernas (Toasts) con animaciones, íconos temáticos (success, info, warning, error) y barra de progreso.

### Uso con Hook o Helper Imperativo

```tsx
import { ToastProvider, useToast, notify } from '../../common-utils';

// 1. Envolver la aplicación en App.tsx:
<ToastProvider>
  <AppContent />
</ToastProvider>

// 2. Usar mediante hook en cualquier componente:
const { notify } = useToast();
notify.success('PDA procesada correctamente', 'Éxito');
notify.info('Información del buque actualizada');
notify.warning('Discrepancia en tarifa detectada', 'Advertencia');
notify.error('No se pudo conectar con el servidor', 'Error');

// 3. O usar la función imperativa exportada en cualquier lugar:
notify.success('Operación completada');
```

