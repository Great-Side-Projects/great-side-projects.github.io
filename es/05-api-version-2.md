# API versión 2 (Provider 2.0)

Prefijo **`/v2`**, JSON. Controladores en `app/controllers/v2/`.

## Rutas (`config/routes.rb`)

| Método | Ruta | Controlador | Notas |
|--------|------|-------------|--------|
| POST | `/quotes` | `V2::QuotesController#create` | Cotización |
| GET | `/rules` | `V2::RulesController#index` | Listado filtrable (`has_scope` en controlador) |
| POST/PATCH | `/rules` / `/rules/:code` | `RulesController` | **create/update** con HTTP Basic Auth |
| GET/PATCH/DELETE | `/rules/:code/assignments` … | `V2::RuleAssignmentsController` | CRUD de asignaciones; Basic Auth salvo **`index`** y **`show`** |
| GET | `/integration_products` | `V2::IntegrationProductsController#index` |
| POST/PATCH | `/integration_products` / `/:code` | idem | **create/update** con Basic Auth |
| POST | `/policies/:product_code` | `V2::PoliciesController#create` | Emisión |
| GET | `/policies/:product_code` | `V2::PoliciesController#index` | Listado/consulta según servicio |
| POST | `/policies/:protocol_number/cancellations` | `V2::CancellationsController#create` | **Cancelación por `protocol_number` de transacción**, no por `product_code` |

Validar rutas exactas en cualquier duda: `bin/rails routes | grep v2`.

## Autenticación HTTP Basic

- `IntegrationProductsController`: Basic en **create/update**; `index` público respecto a Basic.
- `RulesController`: Basic en **create/update**; `index` exceptuado.
- `RuleAssignmentsController`: Basic en **create/update/destroy**; **index** y **show** exceptuados.

Credenciales: `ENV['HTTP_USERNAME']`, `ENV['HTTP_PASSWORD']`.

## Flujo interno típico

1. **Configuration:** `V2::Rules::ConfigurationService` resuelve `Rule` + `RuleAssignment` (y `custom_settings`).
2. **Validación:** `V2::RuleConfigurationValidator`.
3. **HTTP al asegurador:** `Providers::RequestBroker.new(process:, namespace: 'v2').client(payload)` → clases en `lib/providers/v2/`.
4. **Emisión:** `V2::Policies::CreateService` actualiza transacción a `approved` si la respuesta cumple criterios (ver código).

**Cancelación:** `V2::Cancellations::CreateService` + `V2::CancellationPermittedParams`.

## OpenAPI

No hay `swagger/v2/` en el árbol actual; la referencia de payloads está en **serializers** `app/serializers/v2/**/*.rb` y en **`spec/requests/v2/**/*.rb`**.

## Diagrama

[`diagramas/flujo-emision-v2.puml`](./diagramas/flujo-emision-v2.puml)

## Siguiente lectura

- [Guía de código](./06-codigo-guia-desarrollador.md)
- [Integración proveedores](./09-integracion-proveedores.md)
