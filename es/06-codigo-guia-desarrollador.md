# Guía de código para desarrolladores

Mapa orientativo del repositorio `provider-service` para localizar cambios con seguridad.

## Estructura de directorios (alto nivel)

| Ruta | Rol |
|------|-----|
| `app/controllers/v1`, `app/controllers/v2` | Entrada HTTP, params, autenticación |
| `app/services/**` | Lógica de negocio; muchas carpetas por aseguradora o proceso |
| `app/models` | ActiveRecord; enums y validaciones de transición |
| `app/models/brokers` | Enrutado de **qué servicio** ejecuta cada transacción/transición v1 |
| `app/workers` | Consumidores Sneakers; subcarpeta `recurring_charge/` |
| `app/serializers`, `app/serializers/builders` | JSON y builders dinámicos (`BaseGenerator`, `BaseDeliverer`) |
| `lib/providers` | Clientes HTTP Faraday, namespaces `V2`, Pga, Tsana, etc. |
| `config/routes.rb` | Contrato público de la API |
| `db/schema.rb` | Verdad de tablas y tipos |

## RequestBroker: cómo se elige el cliente

Clase: `Providers::RequestBroker`.

1. Se inicializa con `process:` y opcionalmente `namespace:` (`'v1'` por defecto o `'v2'`).
2. `client(payload)` busca en `Providers::PermittedProcesses::ALLOWED_PROCESSES[namespace][process]`.
3. Si el proceso está en `TENANT_PLAN_PROCESSES` para ese namespace, el valor es un **Hash por tenant** y se elige con `Apartment::Tenant.current.to_sym`.
4. Si no hay clase, se lanza `NotExistingError`.

Referencia visual: [`diagramas/request-broker.puml`](./diagramas/request-broker.puml).

## Flujo v1: creación y transición

- **`Brokers::ProcessManager`**: a partir de `transaction.type` y `transaction.process`, resuelve la clase en `PermittedProcedures::TRANSACTIONS` o `TRANSITIONS` (según el flujo que invoque el controlador/servicio). Soporta procedimientos anidados por `product_uid` o `distributor_channel` cuando el valor en el hash es un `Hash`.
- Los servicios concretos suelen usar `Providers::RequestBroker.new(process: ...).client(...)` con payloads específicos del proveedor.

## Flujo v2: reglas y emisión

1. Controlador recibe parámetros (producto, plan, proceso, `api_type`, payload de negocio).
2. `V2::Rules::ConfigurationService` localiza regla y mezcla `custom_settings` de `RuleAssignment`.
3. Cliente V2 (`Providers::V2::PacificoSeguros::Client` u otro) usa `Providers::V2::API::RequestBuilder` para construir la petición HTTP y normalizar respuesta/errores.

Archivo ilustrativo: `app/services/v2/policies/create_service.rb`.

## Builders

Documentados en [provider-service.md](../../../platform-tech-docs/services/provider-service/provider-service.md) (sección Builders):

- **`Builders::BaseGenerator.build(process:, **parameters)`** — serializadores bajo `app/serializers/builders/<process>/...`.
- **`Builders::BaseDeliverer.build(type:, schema:, **parameters)`** — por tipo de transición y esquema.

Si falta la clase constantizada, se lanzan errores `RailsAPIUtils::ExceptionError` con claves i18n (`generator_not_found`, `serializer_not_found`).

## Validadores de esquema

- `app/validators/schemas/request_payload_validator.rb` — payload inicial de transacción.
- `app/validators/schemas/transition_payload_validator.rb` — transiciones para procesos que lo permiten.

## Feature flags

Flipper API montada en rutas (ver `mount Flipper::Api...` en `config/routes.rb`). Útil para tenencias Mi Banco / Pacífico Salud descritas en la documentación en inglés.

## Tests

- `spec/requests` — contratos HTTP.
- `spec/services` — unidad de servicios.
- Al añadir proceso nuevo: actualizar factories/fixtures y permisos en `PermittedProcedures` / `ALLOWED_PROCESSES`.

## Checklist al añadir un proceso nuevo

1. Añadir valor a `Transaction::TRANSACTION_PROCESSES` (y migración si hiciera falta; hoy es enum en modelo).
2. Registrar cliente(s) en `lib/providers/permitted_processes.rb` para `v1` y/o `v2`.
3. Implementar servicio(s) y enlazarlos en `Brokers::PermittedProcedures` si aplica flujo v1.
4. Si es v2: crear/ajustar `Rule` y assignments; validar `V2::RuleConfigurationValidator`.
5. Documentar endpoint o worker y actualizar diagramas en `docs/es/diagramas/`.

## Siguiente lectura

- [Workers](./07-workers-mensajeria.md)
- [Integración proveedores](./09-integracion-proveedores.md)
