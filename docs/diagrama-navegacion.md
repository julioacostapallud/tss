# Diagramas de navegación — SquatGym UI

**Leyenda (todos los diagramas):** nodos = rectángulos · flecha = acción del usuario · `Menú · …` = ítem del menú lateral (válido **desde cualquier pantalla** del rol).

---

## P — Acceso público

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 24, 'rankSpacing': 36}}}%%
flowchart TD
  P01["P-01 Landing"]
  P02["P-02 Iniciar sesión"]
  P03["P-03 Recuperar contraseña"]
  P04["P-04 Restablecer contraseña"]
  P05["P-05 Inicio HOME del rol"]

  P01 -->|Click Ingresar al portal| P02
  P02 -->|Login correcto| P05
  P02 -->|Click Recuperar contraseña| P03
  P03 -->|Continuar| P04
  P04 -->|Contraseña actualizada| P02
  P01 -.->|Ya hay sesión| P05
  P02 -.->|Ya hay sesión| P05
```

---

## A — Administrador

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 18, 'rankSpacing': 28}}}%%
flowchart TD
  CAMP["🔔 Campana alertas<br/>en todas las pantallas A-01…A-06"]
  HDR["Header · logo SquatGym<br/>en todas las pantallas"]
  HDR -->|Click logo| A01M

  subgraph A01["A-01 Inicio HOME"]
    A01M["Menú lateral"]
    A01C["Contenido · panel institucional"]
    A01M --- A01C
    A01C -->|Atajo Reporte cuotas| A02M
    A01C -->|Atajo Ventas SquatShop| A04M
    A01C -->|Atajo Stock| A05M
    A01C -->|Atajo Precios y promos| A03M
    A01C -->|Enlace Lista precios kiosco| A03M
  end

  subgraph A02["A-02 Reporte de cuotas"]
    A02M["Menú lateral"]
    A02C["Contenido · reporte y filtros"]
    A02M --- A02C
    A02C -->|Click Ver recibo| AM1["A-M1 Recibo digital"]
    A02C -->|Tras registrar pago OK| AM1
  end

  subgraph A03["A-03 Planes y promociones"]
    A03M["Menú lateral"]
    A03C["Contenido · solapas cuotas / promos / kiosco"]
    A03M --- A03C
    A03C -->|Click Nuevo plan| AM7["A-M7 Nuevo plan"]
    A03C -->|Click Nuevo producto| AM8["A-M8 Nuevo producto"]
    A03C -->|Click Nueva promoción| AM9["A-M9 Nueva promoción"]
    A03C -->|Click Editar promoción| AM9
  end

  subgraph A04["A-04 Ventas SquatShop"]
    A04M["Menú lateral"]
    A04C["Contenido · ventas por sede"]
    A04M --- A04C
    A04C -->|Menú ⋮ Detalle| AM2["A-M2 Detalle de venta"]
  end

  subgraph A05["A-05 Stock y pedidos"]
    A05M["Menú lateral"]
    A05C["Contenido · tabla stock"]
    A05M --- A05C
    A05C -->|Menú ⋮ Solicitar reposición| AM3["A-M3 Solicitar reposición"]
    A05C -->|Menú ⋮ Ver pedidos en curso| AM4["A-M4 Pedidos en curso"]
    A05C -->|Menú ⋮ Faltantes mostrador| AM5["A-M5 Lista incidencias"]
    A05C -->|Aprobar ajuste sugerido| AM6["A-M6 Ajuste físico stock"]
    AM5 -->|Click Aprobar ajuste| AM6
  end

  subgraph A06["A-06 Auditoría"]
    A06M["Menú lateral"]
    A06C["Contenido · log auditoría"]
    A06M --- A06C
  end

  A01M -->|Menú · Cuotas y Cobros| A02M
  A01M -->|Menú · Planes y Promociones| A03M
  A01M -->|Menú · Ventas| A04M
  A01M -->|Menú · Stock y Pedidos| A05M
  A01M -->|Menú · Auditoría| A06M

  A02M -->|Menú · Inicio| A01M
  A02M -->|Menú · Cuotas y Cobros| A02M
  A02M -->|Menú · Planes y Promociones| A03M
  A02M -->|Menú · Ventas| A04M
  A02M -->|Menú · Stock y Pedidos| A05M
  A02M -->|Menú · Auditoría| A06M

  A03M -->|Menú · Inicio| A01M
  A03M -->|Menú · Cuotas y Cobros| A02M
  A03M -->|Menú · Planes y Promociones| A03M
  A03M -->|Menú · Ventas| A04M
  A03M -->|Menú · Stock y Pedidos| A05M
  A03M -->|Menú · Auditoría| A06M

  A04M -->|Menú · Inicio| A01M
  A04M -->|Menú · Cuotas y Cobros| A02M
  A04M -->|Menú · Planes y Promociones| A03M
  A04M -->|Menú · Ventas| A04M
  A04M -->|Menú · Stock y Pedidos| A05M
  A04M -->|Menú · Auditoría| A06M

  A05M -->|Menú · Inicio| A01M
  A05M -->|Menú · Cuotas y Cobros| A02M
  A05M -->|Menú · Planes y Promociones| A03M
  A05M -->|Menú · Ventas| A04M
  A05M -->|Menú · Stock y Pedidos| A05M
  A05M -->|Menú · Auditoría| A06M

  A06M -->|Menú · Inicio| A01M
  A06M -->|Menú · Cuotas y Cobros| A02M
  A06M -->|Menú · Planes y Promociones| A03M
  A06M -->|Menú · Ventas| A04M
  A06M -->|Menú · Stock y Pedidos| A05M
  A06M -->|Menú · Auditoría| A06M

  CAMP -->|Alerta Stock crítico · Abrir vista| A05M
  CAMP -->|Alerta Faltantes mostrador · Abrir vista| A05M
  CAMP -->|Alerta Reposición en curso · Abrir vista| A05M
```

*Desde A-02, A-05, etc. las mismas flechas `Menú · …` permiten ir a cualquier otra pantalla (no hace falta volver a A-01).*

---

## E — Encargado

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 18, 'rankSpacing': 28}}}%%
flowchart TD
  CAMP["🔔 Campana alertas"]
  HDR["Header · logo"]
  HDR -->|Click logo| E01M

  subgraph E01["E-01 Inicio HOME"]
    E01M["Menú lateral"]
    E01C["Contenido · panel sede"]
    E01M --- E01C
    E01C -->|Atajo Stock| E04M
    E01C -->|Atajo Ventas| E03M
    E01C -->|Atajo Pagos por sede| E02M
    E01C -->|Enlace Gestionar stock| E04M
  end

  subgraph E02["E-02 Reporte de cuotas"]
    E02M["Menú lateral"]
    E02C["Contenido · reporte sede"]
    E02M --- E02C
    E02C -->|Click Ver recibo| EM1["E-M1 Recibo digital"]
  end

  subgraph E03["E-03 Ventas SquatShop"]
    E03M["Menú lateral"]
    E03C["Contenido · listado ventas"]
    E03M --- E03C
    E03C -->|Menú ⋮ Detalle| EM2["E-M2 Detalle de venta"]
  end

  subgraph E04["E-04 Stock y pedidos"]
    E04M["Menú lateral"]
    E04C["Contenido · tabla stock"]
    E04M --- E04C
    E04C -->|Menú ⋮ Solicitar reposición| EM3["E-M3 Solicitar reposición"]
    E04C -->|Menú ⋮ Ver pedidos en curso| EM4["E-M4 Pedidos en curso"]
    E04C -->|Menú ⋮ Faltantes mostrador| EM5["E-M5 Ver incidencias"]
  end

  E01M -->|Menú · Inicio| E01M
  E01M -->|Menú · Cuotas y Cobros| E02M
  E01M -->|Menú · Ventas| E03M
  E01M -->|Menú · Stock y Pedidos| E04M

  E02M -->|Menú · Inicio| E01M
  E02M -->|Menú · Cuotas y Cobros| E02M
  E02M -->|Menú · Ventas| E03M
  E02M -->|Menú · Stock y Pedidos| E04M

  E03M -->|Menú · Inicio| E01M
  E03M -->|Menú · Cuotas y Cobros| E02M
  E03M -->|Menú · Ventas| E03M
  E03M -->|Menú · Stock y Pedidos| E04M

  E04M -->|Menú · Inicio| E01M
  E04M -->|Menú · Cuotas y Cobros| E02M
  E04M -->|Menú · Ventas| E03M
  E04M -->|Menú · Stock y Pedidos| E04M

  CAMP -->|Alerta Socios sin cobro · Abrir vista| E02M
  CAMP -->|Alerta Stock irregular · Abrir vista| E04M
  CAMP -->|Alerta Pedidos reposición · Abrir vista| E04M
  CAMP -->|Alerta Faltantes informados · Abrir vista| E04M
```

---

## S — Secretaria

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 18, 'rankSpacing': 28}}}%%
flowchart TD
  CAMP["🔔 Campana alertas"]
  HDR["Header · logo"]
  HDR -->|Click logo| S01M

  subgraph S01["S-01 Inicio HOME"]
    S01M["Menú lateral"]
    S01C["Contenido · operaciones del día"]
    S01M --- S01C
    S01C -->|Atajo Pagos| S02M
    S01C -->|Atajo Ventas| S03M
    S01C -->|Atajo Stock| S04M
    S01C -->|Enlace Ir a pagos| S02M
  end

  subgraph S02["S-02 Registro de pagos"]
    S02M["Menú lateral"]
    S02C["Contenido · cobro de cuotas"]
    S02M --- S02C
    S02C -->|Click Registrar pago| SM1["S-M1 Registrar pago"]
    S02C -->|Click Ver recibo| SM2["S-M2 Recibo digital"]
    SM1 -->|Pago OK| SM2
  end

  subgraph S03["S-03 SquatShop y caja"]
    S03M["Menú lateral"]
    S03C["Contenido · venta + caja"]
    S03M --- S03C
    S03C -->|Click Abrir caja| SM3a["S-M3a Apertura de caja"]
    S03C -->|Click Cerrar caja| SM3b["S-M3b Cierre de caja"]
    S03C -->|Click Registrar venta| SM3c["S-M3c Confirmar venta"]
    SM3a -->|Confirmar| SM3d["S-M3d Comprobante caja"]
    SM3b -->|Confirmar cierre| SM3d
    SM3c -->|Venta OK| SM3e["S-M3e Comprobante venta"]
  end

  subgraph S04["S-04 Consulta de stock"]
    S04M["Menú lateral"]
    S04C["Contenido · tabla stock"]
    S04M --- S04C
    S04C -->|Click Descargar PDF| S04C
    S04C -->|Menú ⋮ Reportar faltante| SM4["S-M4 Reportar faltante"]
  end

  S01M -->|Menú · Inicio| S01M
  S01M -->|Menú · Registro de Pagos| S02M
  S01M -->|Menú · Ventas| S03M
  S01M -->|Menú · Consulta de Stock| S04M

  S02M -->|Menú · Inicio| S01M
  S02M -->|Menú · Registro de Pagos| S02M
  S02M -->|Menú · Ventas| S03M
  S02M -->|Menú · Consulta de Stock| S04M

  S03M -->|Menú · Inicio| S01M
  S03M -->|Menú · Registro de Pagos| S02M
  S03M -->|Menú · Ventas| S03M
  S03M -->|Menú · Consulta de Stock| S04M

  S04M -->|Menú · Inicio| S01M
  S04M -->|Menú · Registro de Pagos| S02M
  S04M -->|Menú · Ventas| S03M
  S04M -->|Menú · Consulta de Stock| S04M

  CAMP -->|Alerta Socios sin cobro · Abrir vista| S02M
  CAMP -->|Alerta Pagos por conciliar · Abrir vista| S02M
  CAMP -->|Alerta Stock bajo · Abrir vista| S04M
  CAMP -->|Alerta Faltantes mostrador · Abrir vista| S04M
```

---

## L — Alumno

```mermaid
%%{init: {'flowchart': {'curve': 'linear', 'nodeSpacing': 22, 'rankSpacing': 34}}}%%
flowchart TD
  CAMP["🔔 Campana alertas"]
  HDR["Header · logo"]
  HDR -->|Click logo| L01M

  subgraph L01["L-01 Inicio HOME"]
    L01M["Menú lateral"]
    L01C["Contenido · resumen membresía"]
    L01M --- L01C
    L01C -->|Click Ir a mi cuenta| L02M
  end

  subgraph L02["L-02 Resumen de cuenta"]
    L02M["Menú lateral"]
    L02C["Contenido · períodos y pagos"]
    L02M --- L02C
    L02C -->|Click Pagar período| LM1["L-M1 Pago online"]
    L02C -->|Click Ver recibo| LM2["L-M2 Recibo digital"]
    LM1 -->|Pago OK| LM2
  end

  L01M <-->|Menú · Inicio| L01M
  L01M -->|Menú · Estado de Cuenta| L02M
  L02M -->|Menú · Inicio| L01M
  L02M -->|Menú · Estado de Cuenta| L02M

  CAMP -->|Alerta Cuota vencida · Abrir vista| L02M
  CAMP -->|Alerta Pago en verificación · Abrir vista| L02M
  CAMP -->|Alerta Saldo pendiente · Abrir vista| L02M
```

---

## Índice numérico rápido

| Rol | Pantallas | Modales |
|-----|-----------|---------|
| P | P-01 … P-05 | — |
| A | A-01 … A-06 | A-M1 … A-M9 |
| E | E-01 … E-04 | E-M1 … E-M5 |
| S | S-01 … S-04 | S-M1 … S-M4, S-M3a…e |
| L | L-01 … L-02 | L-M1 … L-M2 |

---

*Exportar: [mermaid.live](https://mermaid.live) · Curva **linear** o **step** si el renderizador curva demasiado.*
