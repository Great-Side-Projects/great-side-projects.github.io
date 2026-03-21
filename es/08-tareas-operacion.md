# Tareas Rake y operación

Las tareas documentadas en **platform-tech-docs** sirven para **soporte**, **datos iniciales** y **correcciones** controladas en entornos donde no se quiere exponer la API privada.

> Enlaces relativos al monorepo; alternativa en [README](./README.md).

## Índice (platform-tech-docs)

| Tarea (documento) | Enlace |
|-------------------|--------|
| Actualizar estado de transacción | [update-transaction-status.md](../../../platform-tech-docs/services/provider-service/tasks/update-transaction-status.md) |
| Borrar transacción por email | [delete-transaction-by-email.md](../../../platform-tech-docs/services/provider-service/tasks/delete-transaction-by-email.md) |
| Actualizar código promocional | [update-promotional-code.md](../../../platform-tech-docs/services/provider-service/tasks/update-promotional-code.md) |
| Crear feature toggles | [create-feature-toggles.md](../../../platform-tech-docs/services/provider-service/tasks/create-feature-toggles.md) |

## Tareas citadas en documentación v2

Creación de canal y de `plan_rules` (relación plan–regla–canal):

```bash
bundle exec rake 'monokera:db:create_distributor_channel[tenant_name,channel_name,channel_code]'
bundle exec rake 'monokera:db:create_plan_rules[tenant_name,plan_code,rule_code,channel_code]'
```

Ejemplos en [v2/business_documentation.md](../../../platform-tech-docs/services/provider-service/v2/business_documentation.md).

## Buenas prácticas

- Ejecutar en **staging** antes que producción cuando el cambio sea irreversible.
- Coordinar con **SRE** para altos entornos (mención explícita en la doc de negocio v2).
- Tras cambios de configuración, validar con una **transacción de prueba** o flujo v2 mínimo (quote/issue).

## Siguiente lectura

- [Integración proveedores](./09-integracion-proveedores.md)
