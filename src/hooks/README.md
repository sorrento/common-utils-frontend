# 🪝 Módulo `hooks` (Custom React Hooks)

Colección de Custom React Hooks reutilizables para optimizar el estado y el rendimiento de las apps.

---

## 💾 Estado Persistente (`useLocalStorage`)

```tsx
import { useLocalStorage } from '../../common-utils';

function MyComponent() {
  const [theme, setTheme] = useLocalStorage('app-theme', 'dark');

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Tema actual: {theme}
    </button>
  );
}
```

---

## ⏱️ Retardo en Entradas / Buscadores (`useDebounce`)

```tsx
import { useState } from 'react';
import { useDebounce } from '../../common-utils';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400); // Espera 400ms de inactividad

  // debouncedQuery se actualizará solo cuando el usuario deje de teclear
}
```
