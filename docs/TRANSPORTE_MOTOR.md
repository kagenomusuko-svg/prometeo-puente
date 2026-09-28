# Transporte hacia prometeo-motor-calculo

El puente expone un cliente HTTP mínimo para el endpoint actual:

```text
POST {baseUrl}/calculate
Content-Type: application/json
```

El cuerpo se obtiene exclusivamente de `toLegacyCalculateRequest`:

```json
{
  "formula": "...",
  "data": {},
  "discipline": "..."
}
```

El cliente no calcula, no reintenta automáticamente y no convierte errores del motor en resultados analíticos.

## Errores explícitos

- `MISSING_BASE_URL`
- `MISSING_FETCH`
- `MOTOR_UNREACHABLE`
- `INVALID_TRANSPORT_RESPONSE`
- `MOTOR_HTTP_ERROR`
- `MOTOR_INVALID_JSON`

Después de recibir una respuesta válida, `executeMotorRequest` delega en el adaptador contractual para producir `MotorResult` y `CalculationTrace`.

La versión del motor y la fecha de cálculo deben ser proporcionadas por la configuración/orquestación; no se inventan en el transporte.
