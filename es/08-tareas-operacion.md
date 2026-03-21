# Tareas Rake y operación

Todas viven bajo `lib/tasks/`. Uso típico: `bundle exec rake 'namespace:task[arg1,arg2]'`.

## `monokera:db`

| Tarea | Argumentos | Archivo | Descripción |
|-------|------------|---------|-------------|
| `monokera:db:create_distributor_channel` | `tenant`, `name`, `code`, `persisted_code` (opc.) | `db/create_distributor_channel.rake` | Crea o actualiza `DistributorChannel` en el tenant (`Apartment::Tenant.switch`). |
| `monokera:db:create_tenant` | `tenant` | `create_tenant.rake` | Crea esquema tenant y migra (`Apartment::Tenant.create`). |
| `monokera:db:extensions` | — | `db_extensions.rake` | Extensiones PostgreSQL (`pgcrypto`); enganchado a `db:create` y `db:test:purge`. |

## `monokera:tmp`

| Tarea | Argumentos | Archivo | Descripción |
|-------|------------|---------|-------------|
| `monokera:tmp:update_promotional_code` | `tenant`, `code`, `plan`, `effective_until`, `quantity` | `update_promotional_code.rake` | Actualiza código promocional (`save(validate: false)`). |
| `monokera:tmp:delete_transactions_by_email` | `tenant`, `email` | `delete_transactions_by_email.rake` | Borra transacciones por `request_payload->>'email'` en lotes. |
| `monokera:tmp:update_transaction_status` | `tenant`, `identifier`, `status` | `tmp/update_transaction_status.rake` | Actualiza estado por id de transacción y puede re-disparar `Brokers::ProcessManager`. |
| `monokera:tmp:create_feature_toggles` | `tenant` | `tmp/create_feature_toggles.rake` | Registra toggles Flipper listados en el rake. |
| `monokera:tmp:update_transaction_subscriptions` | (ver constante en archivo) | `tmp/update_transaction_subscription.rake` | Suscripciones recurrentes. |
| `monokera:tmp:update_transaction_payment_payload` | (ver constante) | `tmp/update_transaction_payment_payload.rake` | Payload de pago recurrente. |
| `monokera:tmp:send_policy_issuance_confirmation` | `tenant`, `file_name` | `tmp/send_policy_issuance_confirmation.rake` | Envío confirmación emisión (Yape Event Gateway). |
| `monokera:tmp:update_insurances_transactions_partner_key` | — | `tmp/update_insurances_partner_keys.rake` | Actualiza `partner_key` en transacciones según merchant recurrente. |

## Otras tareas

| Tarea | Archivo | Descripción |
|-------|---------|-------------|
| `reinsurer_worker:status` | `send_reinsurer_worker_message.rake` | Estado cola reinsurer / mensajes pendientes. |
| `reinsurer_worker:send_message` | idem | Publica mensaje de prueba a la cola. |
| `reinsurer_worker:invoke_worker` | idem | Ejecuta worker en proceso sin RabbitMQ. |
| `sneakers:run_debug` | `sneakers_debug.rake` | Sneakers en hilo para depuración. |

## Buenas prácticas

- Ejecutar primero en entorno no productivo; muchas tareas mutan datos sin validaciones completas.
- Verificar tenant con `Apartment.tenant_names` antes de `switch`.

## Siguiente lectura

- [Workers](./07-workers-mensajeria.md)
