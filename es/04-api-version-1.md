# API versión 1

Rutas definidas en `config/routes.rb` bajo `namespace :v1`, formato JSON por defecto.

> Enlaces a páginas detalladas: asumen monorepo con `platform-tech-docs` junto a `provider-service`. Ver [README](./README.md) para URLs en GitHub si no aplica.

## Resumen de recursos

| Recurso | Ruta base (relativa) | Ver documentación |
|---------|----------------------|-------------------|
| Transacciones | `GET/POST /v1/transactions`, `GET /v1/transactions/:protocol_number` | [transaction.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/transaction.md) |
| Transición de estado | `POST /v1/transactions/:protocol_number/status` | [transition.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/transition.md) |
| Tenencia / póliza | `GET /v1/tenancies` | [policy-tenancy.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/policy-tenancy.md) |
| Documentos de póliza | `GET /v1/policy_documents` | [policy-documents.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/policy-documents.md) |
| Códigos promocionales | `GET/POST/PATCH /v1/promotional_codes` (uid vs code según acción) | [promotional-code.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/promotional-code.md) |
| Promotores de venta | `GET /v1/sales_promoters/:sales_promoter_id` | [sales-promoters.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/sales-promoters.md) |
| Reportes | `POST /v1/reports` | [reports.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/reports.md) |
| Asistencias | `POST /v1/assistances` | [assistances.md](../../../platform-tech-docs/services/provider-service/api/v1/assistances.md) |
| Planes Insured Cash | `GET /v1/insured_cash/plans` | [insured-cash-plans.md](../../../platform-tech-docs/services/provider-service/endpoints/v1/insured-cash-plans.md) |
| Tarjeta protegida (emisión por holder) | `GET /v1/protected_card_issuances/:holder_code` | (ver código / swagger si aplica) |

## Transacciones: idea clave

Al crear una transacción se persiste el `request_payload` y metadatos (`type`, `process`, `status` inicial). La **ejecución** contra el proveedor puede ocurrir en el create o en pasos posteriores según el flujo; las **transiciones** disparan lógica en `Brokers::PermittedProcedures::TRANSITIONS` cuando el estado y proceso coinciden.

Para payloads y esquemas por proceso, la documentación histórica en [provider-service.md](../../../platform-tech-docs/services/provider-service/provider-service.md) (sección Transactions) sigue siendo útil; **la lista exacta de procesos y tipos** debe contrastarse siempre con `app/models/transaction.rb` y `app/models/brokers/permitted_procedures.rb`.

## Errores

`ErrorHandler` rescata entre otras `Providers::RequestBroker::NotExistingError` cuando el par `namespace` + `process` no tiene clase registrada en `ALLOWED_PROCESSES` — típico síntoma de proceso mal escrito o integración no registrada para el tenant.

## Documentación OpenAPI

Si Rswag está cargado: montaje en `/api/docs` (rutas del propio servicio).

## Siguiente lectura

- [API v2](./05-api-version-2.md)
- [Integración proveedores](./09-integracion-proveedores.md)
