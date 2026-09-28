# Caso canónico de Fase 0

El fixture tests/fixtures/canonical-case.json representa el encadenamiento contractual mínimo:

1. prometeo-ingesta produce un documento normalizado y un fragmento.
2. prometeo-lenguaje registra una propuesta en estado proposed.
3. una decisión humana explícita confirma la hipótesis.
4. prometeo-caso conserva el modelo confirmado y la decisión.
5. prometeo-proyeccion entrega un MotorRequest cuya proveniencia apunta al modelo confirmado.
6. prometeo-puente adapta el request a la interfaz del motor.

Este archivo sólo verifica contratos y referencias entre salidas. No copia implementaciones de los repositorios productores ni calcula resultados.
