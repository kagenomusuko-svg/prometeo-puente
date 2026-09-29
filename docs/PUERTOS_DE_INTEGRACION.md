# Puertos de integración del puente

`prometeo-puente` coordina el flujo mediante handlers inyectados. No importa implementaciones de `prometeo-caso`, `prometeo-proyeccion`, `prometeo-motor-calculo` ni `prometeo-informe`.

## Regla de autoridad

El puente recibe un sobre validado y lo entrega al puerto correspondiente. El handler debe delegar la operación al repositorio que posee la autoridad:

| Operación pública | Puerto responsable | Resultado que conserva autoridad |
| --- | --- | --- |
| `create-case` | caso | `Case` |
| `add-source` | ingesta/caso | documento normalizado y proveniencia |
| `request-proposals` | lenguaje | propuestas lingüísticas |
| `record-analyst-decision` | caso | decisión y versión de `ConfirmedModel` |
| `request-projection` | proyección | `MotorRequest` |
| `request-calculation` | motor de cálculo | `MotorResult` y `CalculationTrace` |
| `request-report` | informe | `ReportModel` |

La tabla expresa enrutamiento arquitectónico, no una transferencia de autoridad al puente.

## Forma del puerto

Cada handler recibe un sobre interno con esta forma:

```js
{
  operation,
  caseId,
  expectedVersion,
  actorId,
  occurredAt,
  reason,
  provenance,
  payload
}
```

El handler puede ser síncrono o asíncrono y devuelve el resultado de la isla responsable. El puente no transforma resultados matemáticos, no fabrica trazas y no redacta informes.

## Decisión humana

Para `record-analyst-decision`, la transición está contenida en `payload.decision`. La proveniencia humana permanece en el nivel superior del sobre y debe conservarse al persistir la decisión.

El puente sólo comprueba que la autoridad declarada sea humana. La promoción efectiva y la creación de una nueva versión de `ConfirmedModel` pertenecen a `prometeo-caso`.

## Cálculo

Para `request-calculation`, el payload público sólo puede identificar el modelo confirmado y los parámetros permitidos por el contrato del motor. El sitio y el puente no pueden proporcionar `MotorResult`, `CalculationTrace`, fórmulas ni valores calculados.

La ejecución debe terminar en `prometeo-motor-calculo`, única autoridad matemática.

## Criterio de integración

Una composición concreta sólo es válida si:

1. inyecta explícitamente los handlers que necesita;
2. conserva el sobre de proveniencia;
3. no permite que lenguaje o interfaz invoquen directamente el motor;
4. no sustituye el `MotorRequest` proyectado por datos construidos en el puente;
5. entrega al informe el resultado real del motor y su traza.
