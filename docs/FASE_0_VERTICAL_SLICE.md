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

La llamada HTTP real queda cubierta mediante `src/motor-client.mjs` contra `api/server.py` del repositorio `prometeo-motor-calculo`. La prueba ejecutada el 28 de septiembre de 2026 recorrió:

```text
MotorRequest
        ↓
POST /calculate
        ↓
api/server.py + motor.py real
        ↓
MotorResult + CalculationTrace
        ↓
ReportModel
```

La ejecución validó la fórmula `delta`, la taxonomía `universal`, la preservación del resultado exacto y la trazabilidad hasta el informe. La versión ejecutada del motor quedó identificada por el blob `432ac9578da8862d6605b18071576af02b042bce`.
