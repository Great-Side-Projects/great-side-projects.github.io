# Glosario (español)

| Término | Significado en este servicio |
|---------|------------------------------|
| **Transacción** | Registro en `transactions` de una operación de integración (cotización, registro de datos, etc.) con payloads JSON y máquina de estados. |
| **Tipo de transacción** (`type`) | Qué acción de alto nivel se ejecuta: p. ej. `create_quote`, `create_policy`. Ver `Transaction::TRANSACTION_TYPES`. |
| **Proceso** (`process`) | Dominio de negocio del flujo (SOAT, tarjeta protegida, salud, etc.). Debe alinearse entre `Transaction`, `Rule` y registros en `PermittedProcedures` / `ALLOWED_PROCESSES`. |
| **Protocol number** | Identificador único de negocio de la transacción; se usa en URLs v1 y en trazabilidad. |
| **Regla (`Rule`)** | Configuración de llamada a API del asegurador: endpoint, método, headers, esquema de validación y mapeos de parámetros. |
| **`api_type`** | Rol de la regla: `tenancy`, `quote`, `issue`, `cancellation`, o variantes `_first_version` para convivencia de versiones. |
| **`RuleAssignment`** | Enlaza una regla con un `Product` o `Plan` y opcionalmente un `DistributorChannel`; permite `custom_settings` por canal. |
| **Canal distribuidor** | `DistributorChannel`: identifica el canal de venta (Yape, etc.) para resolver la regla correcta. |
| **RequestBroker** | Fábrica que devuelve el cliente HTTP (`Providers::*::Client`) según `process` y `namespace` (v1/v2). |
| **Namespace v2** | Uso de `ALLOWED_PROCESSES[:v2]` y clientes bajo `Providers::V2::*`, típicamente con configuración desde reglas en BD. |
| **Builder (BaseGenerator / BaseDeliverer)** | Patrón para serializar payloads hacia APIs externas sin inflar las clases de servicio. |
| **Worker** | Proceso Sneakers que consume RabbitMQ y dispara servicios/actualizaciones asíncronas. |

Índice general: [README.md](./README.md)
