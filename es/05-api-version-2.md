# API versión 2 (Provider 2.0)

Namespace `v2` en `config/routes.rb`. Pensado para que **Order Service** (u otros clientes internos) operen sobre configuración almacenada en BD y clientes HTTP genéricos por aseguradora (capa `Providers::V2::*`).

> Enlaces a **platform-tech-docs**: rutas relativas al monorepo; alternativa en [README](./README.md).

## Rutas

| Método | Ruta | Controlador / acción | Notas |
|--------|------|----------------------|-------|
| POST | `/v2/quotes` | `V2::QuotesController#create` | Cotización según reglas |
| GET/POST/PATCH/DELETE | `/v2/rules/:code/assignments` | `V2::RuleAssignmentsController` | Asignaciones regla ↔ plan/producto/canal |
| GET | `/v2/rules` | `V2::RulesController#index` | Listado; create/update con Basic Auth |
| POST/PATCH | `/v2/rules` | idem | Privado (Basic) |
| GET/POST/PATCH | `/v2/integration_products` | `V2::IntegrationProductsController` | Productos; create/update con Basic Auth |
| POST | `/v2/policies/:product_code` | `V2::PoliciesController#create` | Emisión (crear póliza en flujo v2) |
| GET | `/v2/policies/:product_code` | `V2::PoliciesController#index` | Consulta según parámetros del servicio |
| POST | `/v2/policies/:protocol_number/cancellations` | `V2::CancellationsController#create` | Cancelación vinculada a transacción |

> Los paths exactos pueden variar si se usan constraints de parámetro; validar siempre `rails routes | grep v2` en el repo.

## Autenticación en endpoints sensibles

`IntegrationProductsController` y el controlador de reglas protegen **create/update** con HTTP Basic (`ENV['HTTP_USERNAME']` / `ENV['HTTP_PASSWORD']`), alineado con la guía en [v2/business_documentation.md](../../../platform-tech-docs/services/provider-service/v2/business_documentation.md): en producción suelen operar **SRE** o procesos controlados para no generar datos basura.

## Flujo de configuración (onboarding)

Orden recomendado (adaptado de la documentación de negocio en inglés):

1. Implementar en código el cliente/contrato necesario en `lib/providers` si no existe.
2. Crear **producto** y **planes** (vía API privada o proceso interno).
3. Crear **canal distribuidor** con rake `monokera:db:create_distributor_channel[...]`.
4. Crear **regla** con esquemas y `api_settings` correctos.
5. Crear **asignación** plan–regla–canal con rake `monokera:db:create_plan_rules[...]` o API de assignments.
6. Probar desde Core/Order el flujo completo.

## Servicios centrales en código

- **`V2::Rules::ConfigurationService`**: resuelve `RuleAssignment` (con fallback sin canal y wrapper legacy), valida con `V2::RuleConfigurationValidator`, construye payload para el broker.
- **`V2::Policies::CreateService`**: exige transacción `pending`, genera configuración, llama `RequestBroker` v2, fusiona `response_payload` y marca `approved` si la respuesta es válida.
- **`V2::Quotes::CreateService`** y **`V2::Cancellations::CreateService`**: mismo patrón de broker v2.

Diagrama: [`diagramas/flujo-emision-v2.puml`](./diagramas/flujo-emision-v2.puml).

## Contratos JSON

Ejemplos y esquemas en [api/v2/payloads/](../../../platform-tech-docs/services/provider-service/api/v2/payloads/) (productos, reglas).

## Documentación de endpoints (detalle)

- [product.md](../../../platform-tech-docs/services/provider-service/endpoints/v2/product.md) — en rutas actuales el recurso puede exponerse como `integration_products`; cruzar con `IntegrationProductsController`.
- [rule.md](../../../platform-tech-docs/services/provider-service/endpoints/v2/rule.md)

## Siguiente lectura

- [Guía de código](./06-codigo-guia-desarrollador.md)
- [Modelo de datos](./03-modelo-datos-y-dominio.md)
