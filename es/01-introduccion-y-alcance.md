# Introducción y alcance

## Qué es Provider Service

Es un **microservicio Rails** que actúa como **capa de integración** entre los productos y flujos de venta de Monokera (Order Service, Core, facturación, mensajería) y las **APIs de aseguradoras y partners** (Pacífico Seguros, Pacífico Salud, Asissprex/Comfamiliar, Assurant, Insurama, Tsana, Yape, etc.).

El servicio:

- Persiste **transacciones** con payloads de solicitud y respuesta para trazabilidad y reportes.
- Gestiona **configuración dinámica** (Provider 2.0): productos, planes, reglas con esquemas JSON y ajustes de API, asignaciones por canal distribuidor.
- Expone **API REST JSON** en versiones **v1** y **v2**.
- Ejecuta **workers** (Sneakers) para cargos recurrentes, confirmaciones y tareas asíncronas ligadas a pólizas y transacciones.

## Qué no es

- No sustituye al **Order Service** (orquestación del pedido/venta hacia Monokera).
- No es el sistema de pagos: recibe/actualiza estado según lo que venga del flujo de pago y mensajes.
- La documentación de negocio detallada de cada producto asegurador sigue viviendo en contratos y runbooks del partner; aquí se documenta **cómo Monokera los consume** a través de este código.

## Stack técnico (referencia)

Según el README del repositorio de aplicación:

- Ruby **3.2.x**, Rails **7.x**
- PostgreSQL
- **Apartment** (multi-tenant por esquema/base según configuración del proyecto): el `RequestBroker` usa `Apartment::Tenant.current` para algunos procesos multi-inquilino.
- **Sneakers** + RabbitMQ para workers
- **Flipper** (montado bajo prefijo v1 en rutas) para feature flags
- **Rswag** en `/api/docs` para documentación OpenAPI en entornos donde esté habilitada

## Fuentes en el código

- Punto de entrada HTTP: `config/routes.rb`
- Modelo transaccional: `app/models/transaction.rb`
- Reglas y asignaciones: `app/models/rule.rb`, `app/models/rule_assignment.rb`
- Resolución de cliente proveedor: `lib/providers/request_broker.rb`, `lib/providers/permitted_processes.rb`
- Enrutado de procedimientos v1: `app/models/brokers/permitted_procedures.rb`, `app/models/brokers/process_manager.rb`

## Siguiente lectura

- [Arquitectura y flujos](./02-arquitectura.md)
- [Guía de código](./06-codigo-guia-desarrollador.md)
