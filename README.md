# 🎨 common-utils-frontend

Librería compartida de UI, Hooks React, Gráficos SVG, Iconos y Servicio de Exportación a PDF y Excel para aplicaciones web frontend.

## 📦 Módulos Incluidos

- 📄 **`src/exporters`**: Servicio de exportación a PDF y Excel (`exportToPdf`, `exportToExcel`).
- 📊 **`src/plots`**: Gráficos SVG interactivos (`ColumnChart`, `DonutChart`).
- 🎨 **`src/icons`**: Colección de iconos SVG reutilizables (`Icons`, `LogoSvg`).
- 🪝 **`src/hooks`**: Custom Hooks de React (`useLocalStorage`, `useDebounce`, `useSpeechRecognition`).
- 🧱 **`src/ui`**: Componentes primitivos UI (`Badge`, `Modal`, `Toast`, `DocumentOrTextExtractor`).

## 🚀 Uso como Submódulo Git

```bash
git submodule add https://github.com/sorrento/common-utils-frontend.git src/common-utils-frontend
```

```typescript
import { 
  exportToExcel, 
  exportToPdf, 
  ColumnChart, 
  DonutChart, 
  Icons, 
  Badge,
  Modal,
  useLocalStorage, 
  useDebounce 
} from './common-utils-frontend';
```
