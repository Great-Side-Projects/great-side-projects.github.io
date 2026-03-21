# Provider Service — Documentación para desarrolladores (ES)

Documentación consolidada del **Provider Service** (Rails): propósito del microservicio, arquitectura, modelo de datos, APIs v1/v2, organización del código, workers y tareas operativas. Vive en **este repositorio** (`provider-service/docs/es/`). Los detalles de endpoints, workers y tasks siguen en el repo **[platform-tech-docs](https://github.com/monokera-tech/platform-tech-docs)** (en un monorepo local suele ser la carpeta hermana `platform-tech-docs`).

## Audiencia y objetivo

- **Quién:** desarrolladores que deben entender, extender o depurar integraciones con aseguradoras y canales.
- **Qué obtienes:** mapa mental del sistema, dónde tocar código, cómo fluyen las peticiones y qué tablas/configuración las sostienen.

## Índice de guías

| Documento | Contenido |
|-----------|-----------|
| [Introducción y alcance](./01-introduccion-y-alcance.md) | Qué es el servicio, qué no es, stack, multi-tenant (Apartment), dependencias externas. |
| [Arquitectura y flujos](./02-arquitectura.md) | Vista en capas, v1 vs v2, diagramas (referencias PlantUML). |
| [Modelo de datos y dominio](./03-modelo-datos-y-dominio.md) | Entidades principales, enums de `Transaction` y `Rule`, relaciones. |
| [API versión 1](./04-api-version-1.md) | Rutas v1, transacciones, transiciones, recursos auxiliares; enlaces a specs de endpoints. |
| [API versión 2](./05-api-version-2.md) | Productos integración, reglas, cotizaciones, pólizas, cancelaciones; flujo con Order Service. |
| [Guía de código para desarrolladores](./06-codigo-guia-desarrollador.md) | Carpetas clave, `RequestBroker`, `ProcessManager`, builders, servicios V2. |
| [Workers y mensajería](./07-workers-mensajeria.md) | Sneakers/RabbitMQ, workers recurrentes y de póliza. |
| [Tareas Rake y operación](./08-tareas-operacion.md) | Tareas documentadas y buenas prácticas (SRE/QA). |
| [Integración con proveedores](./09-integracion-proveedores.md) | Clientes en `lib/providers`, procesos permitidos v1/v2. |
| [Glosario](./10-glosario.md) | Términos recurrentes (transacción, regla, broker, etc.). |

## Diagramas PlantUML

Los fuentes viven en [`diagramas/`](./diagramas/). Puedes renderizarlos con [PlantUML](https://plantuml.com/) (CLI, plugin de IDE o servidor).

| Archivo | Uso |
|---------|-----|
| [`diagramas/contexto-c4.puml`](./diagramas/contexto-c4.puml) | Contexto: actores y sistemas vecinos. |
| [`diagramas/mer-entidades.puml`](./diagramas/mer-entidades.puml) | Modelo entidad-relación (tablas nucleares). |
| [`diagramas/reglas-plan-canal.puml`](./diagramas/reglas-plan-canal.puml) | Producto, plan, regla, canal y `RuleAssignment`. |
| [`diagramas/request-broker.puml`](./diagramas/request-broker.puml) | Resolución de cliente HTTP por proceso y namespace. |
| [`diagramas/flujo-transaccion-v1.puml`](./diagramas/flujo-transaccion-v1.puml) | Flujo alto nivel transacción v1 + transición. |
| [`diagramas/flujo-emision-v2.puml`](./diagramas/flujo-emision-v2.puml) | Emisión v2 con `ConfigurationService` y cliente V2. |

## Documentación en platform-tech-docs (referencia cruzada)

En un monorepo con `provider-service` y `platform-tech-docs` al mismo nivel, las rutas relativas usadas en las guías apuntan a `../../../platform-tech-docs/services/provider-service/`. Si solo clonaste `provider-service`, usa el repo en GitHub:

- Visión general: [provider-service.md](https://github.com/monokera-tech/platform-tech-docs/blob/master/services/provider-service/provider-service.md)
- Provider 2.0: [business_documentation.md](https://github.com/monokera-tech/platform-tech-docs/blob/master/services/provider-service/v2/business_documentation.md)
- [Endpoints](https://github.com/monokera-tech/platform-tech-docs/tree/master/services/provider-service/endpoints)
- [Workers](https://github.com/monokera-tech/platform-tech-docs/tree/master/services/provider-service/workers)
- [Tasks](https://github.com/monokera-tech/platform-tech-docs/tree/master/services/provider-service/tasks)
- [Contratos JSON v2](https://github.com/monokera-tech/platform-tech-docs/tree/master/services/provider-service/api/v2/payloads)

## Mantenimiento de esta documentación

Al añadir un **nuevo proceso** en `Transaction::TRANSACTION_PROCESSES`, una entrada en `Providers::PermittedProcesses::ALLOWED_PROCESSES`, o una **nueva ruta** en `config/routes.rb`, actualizar al menos: [03-modelo-datos-y-dominio.md](./03-modelo-datos-y-dominio.md), [06-codigo-guia-desarrollador.md](./06-codigo-guia-desarrollador.md), [09-integracion-proveedores.md](./09-integracion-proveedores.md) y el diagrama afectado en `diagramas/`.
