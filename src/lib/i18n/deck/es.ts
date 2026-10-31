import type { DeckCopy } from "./en";
export const deckSpanish: DeckCopy = {
  event: "TUM Blockchain & AI Hackathon · 31 de octubre de 2026",
  live: "Producto en funcionamiento",
  architecture: "Arquitectura del sistema",
  workflow: "Flujo de usuario",
  capture: "Captura real de la aplicación",
  diagram: "Diagrama de arquitectura",
  capturedSteps: "Vista previa de los pasos capturados",
  previewNote:
    "Capturas con fecha y hora de interacciones reales, reunidas en una breve secuencia. No es una grabación continua de pantalla.",
  captureLanguage:
    "Los elementos visuales conservan la interfaz y las etiquetas de arquitectura en inglés.",
  playPreview: "Reproducir pasos capturados",
  pausePreview: "Pausar vista previa",
  openVisual: "Abrir imagen a tamaño completo",
  navigation: "Navegación de la presentación",
  contents: "Elegir una diapositiva",
  keyboard: "← → para navegar · Inicio / Fin",
  snapshot: "Estado de la evidencia · 31 de octubre de 2026",
  verified: "Observado",
  pending: "Pendiente de verificar",
  designed: "Flujo implementado",
  heroTitle: "Un equipo de seguridad al que puedes hacer preguntas.",
  heroBody:
    "Ocnif convierte la evidencia aportada en una evaluación que puedes revisar, con agentes especializados, actividad de herramientas visible y una decisión humana al final.",
  heroCaption:
    "El espacio de trabajo de Ocnif desplegado: conversación, hallazgos, actividad y estado de los servicios en un solo lugar.",
  heroPoint1: "Investiga en lenguaje natural",
  heroPoint2: "Examina la evidencia que sustenta la respuesta",
  heroPoint3:
    "Aprueba por separado la publicación y las acciones de la billetera",
  problemTitle: "De señales dispersas a una revisión que permite actuar.",
  problemBody:
    "Para pequeños equipos de seguridad, ingenieros de plataforma y organizaciones que necesitan comprender su exposición sin añadir otra cola de alertas.",
  problem1Title: "El contexto está disperso",
  problem1Body:
    "Cabeceras, registros, mensajes sospechosos y preguntas llegan por distintos canales.",
  problem2Title: "Las respuestas necesitan trazabilidad",
  problem2Body:
    "El equipo necesita ver qué hizo un agente, qué evidencia respalda un hallazgo y qué sigue siendo incierto.",
  problem3Title: "Cada acción necesita un responsable",
  problem3Body:
    "Aceptar un informe, compartirlo públicamente, pagar y ejecutar transacciones de contratos requiere decisiones humanas explícitas y separadas.",
  workflowTitle: "Una conversación. Una secuencia de trabajo visible.",
  workflowBody:
    "Aporta evidencia, elige una tarea, orienta a los agentes especializados y revisa el resultado. La publicación y los flujos de cada red tienen sus propios pasos de aprobación.",
  workflowCaption:
    "El recorrido completo del usuario, incluidos los puntos de decisión que separan la evaluación, la publicación y el pago.",
  workflowNote:
    "La evaluación se limita a la evidencia aportada por el usuario. Esta demostración no acredita un escaneo autorizado de un sistema externo.",
  assessmentTitle: "Observa cómo se desarrolla una evaluación.",
  assessmentBody:
    "Una solicitud real genera eventos de agentes y herramientas en directo, una respuesta escrita y hallazgos estructurados. El usuario puede orientar o cancelar la tarea en curso.",
  assessmentCaption:
    "Capturado en la aplicación desplegada con una solicitud acotada de evidencia de seguridad sintética.",
  assessmentNote:
    "La evidencia es sintética; la interacción con la aplicación y la ejecución del modelo son reales.",
  architectureTitle:
    "Razonamiento compartido. Límites de confianza explícitos.",
  architectureBody:
    "El espacio de trabajo web se conecta a un backend Rust y a un entorno compartido de ejecución del modelo. La persistencia, la voz y los adaptadores de los patrocinadores tienen responsabilidades distintas.",
  architectureCaption:
    "Cómo se conectan la aplicación, el entorno de agentes, el almacén de datos, los servicios de voz opcionales y las integraciones de las tres redes.",
  architectureNote:
    "Las credenciales de los proveedores permanecen en el servidor. Las billeteras del navegador conservan sus claves y requieren la aprobación del usuario.",
  reportTitle: "Un hallazgo resulta útil cuando se puede revisar.",
  reportBody:
    "Las tarjetas estructuradas facilitan la lectura de la evaluación. Los eventos de actividad conservan el proceso que la produjo. El usuario revisa el informe y decide por separado si lo publica.",
  reportCaption:
    "Un informe generado real y sus controles de revisión en el espacio de trabajo de Ocnif.",
  reportNote:
    "Aceptar un informe registra una decisión en el espacio de trabajo. No demuestra que se haya corregido el problema, no publica automáticamente ni ejecuta un pago.",
  cardanoTitle: "Cardano: una tarea de agente remunerada con recibo.",
  cardanoBody:
    "Sokosumi proporciona el flujo de tareas del espacio Personal. Masumi coordina el ciclo del pago en Cardano Preprod, mientras el worker de Ocnif ejecuta la tarea de seguridad solicitada.",
  cardanoCaption:
    "La integración elegida de Masumi + Sokosumi, desde la creación de la tarea hasta la entrega del resultado y la posterior retirada del vendedor.",
  cardanoStatus:
    "Tarea remunerada del espacio Personal completada · retirada del vendedor confirmada",
  cardanoProofTitle: "Haz visible cada etapa del pago.",
  cardanoProofBody:
    "Completar una tarea, bloquear fondos, entregar un resultado y retirar fondos como vendedor son eventos diferentes. La presentación distingue la evidencia de cada uno.",
  cardanoProofCaption:
    "Pasos reales de la interfaz. El panel en la nube muestra el estado de preparación para ejecución sin pago; la tarea remunerada Personal verificada por separado se ejecutó mediante el worker nativo de Ocnif. Se omiten los identificadores privados.",
  cardanoProofNote:
    "Observado: 1 USDM de prueba / 100 créditos; FundsLocked, ResultSubmitted y retirada del vendedor confirmados. Neto recibido por el vendedor: +1 USDM de prueba. El resultado del espacio Personal no acredita un resultado en el espacio de una organización.",
  api3Title: "API3: evidencia firmada antes de decidir en cadena.",
  api3Body:
    "Solicita una atestación de vulnerabilidad de NVD, revisa las condiciones de pago en Base Sepolia y verifica la respuesta firmada antes de aprobar por separado una transacción del contrato verificador.",
  api3Caption:
    "El desafío x402 y el flujo de pago EIP-3009, la verificación de evidencia NVD firmada y la decisión basada en una política CVSS.",
  api3Status:
    "Desafío real sin pagar verificado · atestación pagada y ejecución del contrato pendientes",
  api3ProofTitle: "Revisa el CVE, el destinatario y la política exactos.",
  api3ProofBody:
    "La interfaz vincula la aprobación al CVE seleccionado y conserva los intentos de pago anteriores. Cambiar el CVE invalida la revisión anterior; un resultado incierto no puede generar silenciosamente un pago nuevo.",
  api3ProofCaption:
    "Pasos reales de la interfaz API3. La vista previa no afirma que un pago se haya liquidado ni que se haya desplegado un contrato verificador.",
  api3ProofNote:
    "Base Sepolia utiliza el activo aUSD indicado en la oferta. El usuario revisa por separado las firmas de la billetera, el gas del despliegue, la antigüedad de la evidencia y el umbral CVSS.",
  bsvTitle: "BSV: compra un informe o transfiere un pase de acceso.",
  bsvBody:
    "Un informe publicado puede usar una compra BRC-121 o un pase BSV-21 registrado. La titularidad verificada por el overlay controla el acceso, y un intercambio atómico requiere que ambas partes revisen la oferta.",
  bsvCaption:
    "Publicación del informe, aprobación explícita del pago o la emisión, admisión en el overlay, verificación de titularidad e intercambio entre dos billeteras.",
  bsvStatus:
    "Overlay y emisor configurados · ejecución real con billeteras pendiente",
  bsvProofTitle: "El usuario conserva el control de su billetera.",
  bsvProofBody:
    "La interfaz comprueba la red configurada, el hash del informe, el destinatario, el importe y el titular. Una transacción guardada cuyo resultado es incierto puede conciliarse sin crear otra emisión o pago.",
  bsvProofCaption:
    "Pasos reales de la interfaz BSV y su estado de preparación. Esta vista previa no acredita compras, emisiones, intercambios con fondos reales ni confirmaciones en cadena.",
  bsvProofNote:
    "La admisión en el overlay es distinta de la confirmación en un bloque. Cada pase nuevo tiene una oferta fija de una unidad, pero emitirlo no hace que el informe sea único globalmente. Las compras directas de informes aún requieren configurar al comerciante.",
  closingTitle: "Prueba el producto. Examina la evidencia.",
  closingBody:
    "El siguiente paso es un piloto con un equipo real: aportar un conjunto acotado de evidencia, revisar la evaluación y determinar si el flujo reduce el trabajo entre una señal y una decisión.",
  deliveredTitle: "Disponible para evaluar",
  deliveredBody:
    "Espacio de trabajo desplegado; ejecuciones reales de agentes; mensajes y eventos persistidos; informes estructurados; revisiones explícitas de publicación y pago; interfaz en cuatro idiomas.",
  provenTitle: "Verificado en pruebas acotadas",
  provenBody:
    "Evaluación real en la nube y recorrido WebRTC sintético; tarea remunerada Personal de Cardano y retirada confirmada; desafío sin pagar de API3; SDK de BSV y flujos en una cadena simulada.",
  nextTitle: "Próximas pruebas de aceptación",
  nextBody:
    "Ejecución real con billeteras API3 y BSV; aceptación con micrófono nativo y tecnologías de asistencia; recorridos completos de modelo y voz en los cuatro idiomas.",
  closingNote:
    "Es una implementación de hackathon y una instantánea de la evidencia, no una afirmación de que se haya completado toda la hoja de ruta ni cada recorrido de integración.",
  openWorkspace: "Abrir el espacio de trabajo en funcionamiento",
  openPayments: "Examinar los flujos de las redes",
};
