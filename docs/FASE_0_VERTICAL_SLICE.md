# Fase 0 — prueba vertical del puente

Esta prueba valida la frontera entre los repositorios sin copiar sus implementaciones.

## Cadena cubierta

```text
salida contractual de prometeo-proyeccion
        ↓
prometeo-puente
        ↓
solicitud heredada del motor
        ↓
respuesta con traza
        ↓
MotorResult + CalculationTrace
```

El archivo `tests/fixtures/projection-output.json` representa exclusivamente la salida contractual de `prometeo-proyeccion`. No vuelve a implementar el proyector.

La función `simulatedMotor` sólo simula la forma de respuesta de `prometeo-motor-calculo`; no calcula una fórmula dentro del puente. La prueba verifica correlación, conservación de exactitud, trazabilidad y metadatos externos.

La llamada real al motor queda pendiente de integración de transporte. El puente todavía no expone HTTP ni red.
