# TODO Desarrollo SquatGym

## Etapa 1 - Relevamiento tecnico del proyecto existente
- [x] Revisar estructura actual
- [x] Identificar layout, rutas, menu y componentes comunes
- [x] Identificar fakeapi/mock actual si existe
- [x] Definir integracion sin romper diseno existente

## Etapa 2 - Reestructuracion modular
- [x] Crear estructura src/app, src/modules, src/components, src/fakeApi, src/shared
- [x] Mover o adaptar componentes existentes sin romper imports
- [x] Centralizar rutas
- [x] Centralizar menu por rol

## Etapa 3 - Fake API y datos demo
- [x] Implementar storage localStorage
- [x] Implementar seed inicial
- [x] Crear usuarios y roles
- [x] Crear sedes
- [x] Crear alumnos
- [x] Crear planes
- [x] Crear promociones
- [x] Crear pagos historicos
- [x] Crear productos kiosco
- [x] Crear stock por sede
- [x] Crear ventas kiosco
- [x] Crear pedidos reposicion
- [x] Crear auditoria simulada

## Etapa 4 - Gestion de Pagos
- [x] Registrar pago de cuota desde Secretaria
- [x] Calcular prorrateo
- [x] Aplicar promocion/descuento
- [x] Emitir recibo digital
- [x] Consultar estado de cuenta desde Secretaria
- [x] Vista del alumno para estado de cuenta
- [x] Vista del alumno para pagar cuota
- [x] Configurar promociones y precios desde Administrador
- [x] Reporte simple de pagos

## Etapa 5 - Kiosco
- [x] Registrar venta presencial
- [x] Carrito interno de venta
- [x] Descuento automatico de stock
- [x] Consulta de stock por sede
- [x] Alertas de stock bajo/agostado
- [x] Generar pedido de reposicion
- [x] Consultar ventas diarias por sede
- [x] Reporte simple de kiosco

## Etapa 6 - Roles y menu
- [x] Simular sesion por usuario
- [x] Mostrar menu segun rol
- [x] Restringir rutas visualmente segun rol
- [x] Alumno ve "Mi cuenta", no "Gestion de Pagos"
- [x] Secretaria ve pagos y kiosco operativo
- [x] Encargado ve consultas, stock, reposicion y ventas de su sede
- [x] Administrador ve reportes y configuracion

## Etapa 7 - Responsive
- [ ] Revisar todas las pantallas en desktop
- [ ] Revisar todas las pantallas en tablet
- [ ] Revisar todas las pantallas en movil
- [ ] Adaptar tablas a cards o scroll controlado
- [ ] Verificar sidebar/header responsive
- [ ] Verificar formularios en movil

## Etapa 8 - Pruebas funcionales
- [ ] Registrar pago con efectivo
- [ ] Registrar pago con QR
- [ ] Aplicar descuento
- [ ] Generar recibo
- [ ] Alumno paga desde su cuenta
- [ ] Registrar venta kiosco
- [ ] Validar venta sin stock suficiente
- [ ] Ver alerta por stock bajo
- [ ] Generar reposicion
- [ ] Validar menu por rol
