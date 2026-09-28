# Caso canónico de Fase 0

El fixture tests/fixtures/canonical-case.json representa el encadenamiento contractual mínimo:

1. prometeo-ingesta produce un documento normalizado y un fragmento.
2. prometeo-contexto devuelve un localizador del mapa externo de Paradigma.
3. prometeo-lenguaje registra una propuesta en estado proposed y conserva el localizador como contexto.
4. una decisión humana explícita confirma la hipótesis.
5. prometeo-caso conserva el modelo confirmado y la decisión.
6. prometeo-proyeccion entrega un MotorRequest cuya proveniencia apunta al modelo confirmado.
7. prometeo-puente adapta el request a la interfaz del motor.

El localizador contextual no se presenta como evidencia confirmada y no modifica el modelo ni el informe.

Este archivo sólo verifica contratos y referencias entre salidas. No copia implementaciones de los repositorios productores ni calcula resultados.
