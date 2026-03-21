# Provider Service — Documentación para desarrolladores (ES)

Toda la guía vive en **este repositorio** (`provider-service/docs/es/`): arquitectura, rutas HTTP, workers RabbitMQ, tareas Rake, modelos, integración con aseguradoras y diagramas PlantUML. Está alineada con el código actual; no depende de otros repos de documentación.

## Audiencia y objetivo

- **Quién:** desarrolladores que extienden o depuran integraciones con aseguradoras y canales.
- **Qué obtienes:** mapa del código, contratos HTTP reales (`config/routes.rb`), colas y routing keys, y dónde registrar nuevos procesos.

## Índice de guías

| Documento | Contenido |
|-----------|-----------|
| [01 — Introducción y alcance](./01-introduccion-y-alcance.md) | Rol del servicio, stack (Gemfile.lock), Apartment, gems clave. |
| [02 — Arquitectura y flujos](./02-arquitectura.md) | Capas, v1 vs v2, Mermaid, enlaces a diagramas `.puml`. |
| [03 — Modelo de datos](./03-modelo-datos-y-dominio.md) | Tablas y modelos ActiveRecord, enums, `plan_rules` → `rule_assignments`. |
| [04 — API v1](./04-api-version-1.md) | Rutas, controladores, scopes, OpenAPI/Swagger, errores. |
| [05 — API v2](./05-api-version-2.md) | Integration products, rules, quotes, policies, cancellations. |
| [06 — Guía de código](./06-codigo-guia-desarrollador.md) | RequestBroker, ProcessManager, TransitionManager, ErrorHandler, builders. |
| [07 — Workers y mensajería](./07-workers-mensajeria.md) | Cola, routing keys y clase por worker (extraído del código). |
| [08 — Tareas Rake](./08-tareas-operacion.md) | Todas las tareas en `lib/tasks/`. |
| [09 — Integración proveedores](./09-integracion-proveedores.md) | `ALLOWED_PROCESSES` y `PermittedProcedures` (TRANSACTIONS / TRANSITIONS). |
| [10 — Glosario](./10-glosario.md) | Términos. |
| [11 — Mapa del repositorio](./11-mapa-repositorio.md) | Inventario de carpetas (`app/`, `lib/providers/`, `spec/`). |

## Diagramas PlantUML

Directorio [`diagramas/`](./diagramas/). Render con [PlantUML](https://plantuml.com/).

## Contratos y pruebas

- **OpenAPI (Rswag):** `swagger/v1/swagger.yaml` y esquemas en `swagger/v1/schemas/`; UI montada en `/api/docs` (ver `config/routes.rb`).
- **Especificación por comportamiento:** `spec/requests`, `spec/services`, `spec/workers`.

## Mantenimiento

Al cambiar rutas, workers, enums de `Transaction`/`Rule` o `ALLOWED_PROCESSES`, actualizar las secciones correspondientes en `04`, `07`, `03`, `09` y diagramas si aplica.
