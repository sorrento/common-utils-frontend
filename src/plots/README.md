# 📊 Módulo `plots` (Gráficos)

Componentes React ligeros y animados en SVG puro (sin dependencias externas pesadas) para visualización de datos.

---

## 📈 Gráfico de Columnas (`ColumnChart`)

Soporta columnas de valores y opcionalmente una línea superpuesta.

```tsx
import { ColumnChart } from '../../common-utils';

<ColumnChart
  labels={['Ene', 'Feb', 'Mar', 'Abr', 'May']}
  values={[45, 60, 35, 80, 95]}
  lineValues={[50, 55, 65, 70, 85]}
  barColor="#2B73E0"
  lineColor="#F59E0B"
  height={220}
/>
```

---

## 🍩 Gráfico de Donas (`DonutChart`)

Muestra una distribución por segmentos de color.

```tsx
import { DonutChart } from '../../common-utils';

const segments = [
  { label: 'Completado', value: 65, color: '#31C48D' },
  { label: 'En proceso', value: 25, color: '#F59E0B' },
  { label: 'Pendiente', value: 10, color: '#E02424' },
];

<DonutChart segments={segments} size={160} animate={true} />
```
