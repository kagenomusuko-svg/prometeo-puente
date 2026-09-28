# prometeo-puente

Orquestador y frontera de integración del ecosistema Prometeo.

Este primer corte sólo adapta el contrato normativo `MotorRequest` a la API heredada de `prometeo-motor-calculo` y envuelve su respuesta como `MotorResult`.

No calcula, no interpreta, no confirma modelos y no selecciona fórmulas.

```bash
npm test
```
