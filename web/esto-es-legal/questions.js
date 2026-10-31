/** Fictional cases and provisional legal teaching. NOT professionally reviewed. */
export const DEMO_NOTICE =
  "CASOS FICTICIOS · Contenido jurídico provisional, pendiente de revisión con vLex Vincent.";
export const editorialScope = Object.freeze({
  proposedJurisdiction: "España y Unión Europea",
  jurisdictionConfirmed: false,
  publicationAllowed: false,
  professionallyReviewed: false,
  vincentVerified: false,
});
export const questions = [
  {
    id: "legal-demo-01",
    slug: "contrato-chat",
    level: 1,
    scene: "plaza",
    topic: "Contratos",
    title: "Un contrato por WhatsApp",
    prompt:
      "Brinco acuerda por WhatsApp el objeto y el precio de un encargo. Trampín dice: «Sin firma en papel nunca existe contrato». ¿Es correcta esa afirmación?",
    options: [
      "Sí: solo obliga lo firmado en papel",
      "No: el formato, por sí solo, no decide su validez",
      "Sí: los mensajes solo sirven para negociar",
    ],
    correct: 1,
    explanation:
      "Un contrato no exige siempre papel para ser obligatorio. Hay que revisar consentimiento, objeto, causa y los requisitos de forma que correspondan. Este caso ficticio no permite dar por válido cualquier encargo por chat.",
    hint: "Distingue la existencia de un acuerdo de los requisitos de forma aplicables.",
    myth: "Si no gastas tinta, no gastas derechos. ¿O sí?",
    exhibit:
      "Mensaje ficticio: «Acepto el encargo descrito por 80 €. De acuerdo».",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Código Civil",
        reference: "Arts. 1261 y 1278",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-02",
    slug: "compra-tienda",
    level: 1,
    scene: "jardin",
    topic: "Consumo",
    title: "Devolver no siempre es desistir",
    prompt:
      "Lexi compra presencialmente una taza sin defecto y cambia de opinión. «La tienda tiene que devolverme el dinero en 14 días siempre», dice Trampín. ¿Qué falta distinguir?",
    options: [
      "El color de la taza",
      "Si ha conservado la bolsa",
      "Una compra presencial de una compra a distancia",
    ],
    correct: 2,
    explanation:
      "El desistimiento previsto con carácter general para contratos a distancia o fuera del establecimiento no se traslada automáticamente a toda compra presencial. Deben revisarse la política de devoluciones y las circunstancias; un producto defectuoso plantea otra cuestión.",
    hint: "El lugar y el modo de contratar importan.",
    myth: "He contado catorce días: ¡mi calendario manda en todas las tiendas!",
    exhibit:
      "Ticket ficticio: «Compra realizada en establecimiento. Producto sin defecto».",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title:
          "Texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios",
        reference: "Art. 102 · ámbito del desistimiento",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-03",
    slug: "trabajo-verbal",
    level: 1,
    scene: "plaza",
    topic: "Trabajo",
    title: "Sin papel, ¿sin derechos?",
    prompt:
      "Aura empieza a trabajar sin que le entreguen un contrato escrito. Trampín asegura que así no puede existir relación laboral. ¿Qué afirmación es más precisa?",
    options: [
      "La falta de escrito no descarta por sí sola una relación laboral",
      "Sin papel no hay salario ni derechos",
      "Solo hay relación laboral si la empresa la llama así",
    ],
    correct: 0,
    explanation:
      "El contrato de trabajo puede celebrarse por escrito o de palabra, con supuestos en los que se exige forma escrita. Las condiciones y la realidad de la prestación deben revisarse: la ausencia de un documento no borra automáticamente una relación laboral.",
    hint: "Revisa la realidad del trabajo y los requisitos de forma; no solo el título del documento.",
    myth: "Sin PDF no hay jefe. ¡Ojalá fuera tan sencillo!",
    exhibit:
      "Supuesto ficticio: trabajo personal, remunerado y bajo organización de otra persona.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Estatuto de los Trabajadores",
        reference: "Art. 8.1 y 8.2",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-04",
    slug: "foto-publica",
    level: 1,
    scene: "biblioteca",
    topic: "Privacidad",
    title: "Una foto pública no es carta blanca",
    prompt:
      "Lúmina publica un retrato en una red social. Una tienda quiere usarlo en un anuncio porque «ya estaba en Internet». ¿Basta ese argumento?",
    options: [
      "Sí, si se menciona su perfil",
      "No, estar publicada no autoriza cualquier uso publicitario",
      "Sí, si no se modifica la fotografía",
    ],
    correct: 1,
    explanation:
      "La publicación de una imagen no equivale a una autorización general para cualquier finalidad. Deben revisarse los derechos sobre la propia imagen, el uso concreto y las autorizaciones o excepciones aplicables. No se valora una reclamación individual.",
    hint: "Publicar para una finalidad no significa autorizar cualquier otra.",
    myth: "El botón de descargar no viene con un permiso universal. Qué detalle.",
    exhibit:
      "Boceto ficticio de anuncio: retrato tomado de un perfil público, sin autorización aportada.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title:
          "Ley Orgánica 1/1982, de protección civil del derecho al honor, a la intimidad personal y familiar y a la propia imagen",
        reference: "Arts. 2, 7 y 8",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1982-11196",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-05",
    slug: "denuncia-condena",
    level: 1,
    scene: "biblioteca",
    topic: "Garantías",
    title: "Denuncia no es condena",
    prompt:
      "Don Lex recibe una noticia: «Una persona ha sido denunciada». Trampín la presenta como si ya existiera una condena. ¿Qué diferencia importa?",
    options: [
      "Ninguna, si la noticia se ha compartido mucho",
      "Solo importa cuántas personas la denuncien",
      "Una denuncia no equivale a una declaración de culpabilidad",
    ],
    correct: 2,
    explanation:
      "La presunción de inocencia impide confundir la presentación de una denuncia con una condena. Para hablar de una resolución hay que comprobar qué órgano la dicta, qué decide y en qué estado se encuentra.",
    hint: "Distingue una comunicación inicial de una resolución que declara hechos o responsabilidades.",
    myth: "Mi grupo de chat ya ha deliberado. Pero no es un tribunal.",
    exhibit:
      "Titular ficticio: «Presentada una denuncia». No se aporta sentencia.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Constitución Española",
        reference: "Art. 24.2",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-06",
    slug: "desistimiento-medida",
    level: 2,
    scene: "jardin",
    topic: "Consumo",
    title: "El traje hecho a medida",
    prompt:
      "Brinco encarga por Internet un traje confeccionado según sus medidas y luego cambia de opinión. ¿Se puede afirmar que toda compra online tiene desistimiento sin excepción?",
    options: [
      "No: hay que revisar las excepciones, incluida la confección personalizada",
      "Sí: el canal online elimina todas las excepciones",
      "Sí: cambiar de opinión equivale a un defecto",
    ],
    correct: 0,
    explanation:
      "El régimen de desistimiento tiene excepciones, entre ellas determinados bienes confeccionados conforme a especificaciones del consumidor o claramente personalizados. Hay que comprobar el supuesto y la información contractual. La falta de conformidad es una cuestión distinta.",
    hint: "No confundas desistimiento con reclamación por un defecto.",
    myth: "¡Todo lo que lleva carrito de compra se puede devolver igual!",
    exhibit:
      "Pedido ficticio: «Traje confeccionado según las medidas facilitadas».",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title:
          "Texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios",
        reference: "Arts. 102 y 103.c",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-07",
    slug: "fianza-mes",
    level: 2,
    scene: "plaza",
    topic: "Vivienda",
    title: "La fianza no paga sola el último mes",
    prompt:
      "Aura quiere dejar de pagar el último mes de alquiler porque entregó una fianza. ¿La existencia de esa fianza permite dar por sustituida automáticamente la renta?",
    options: [
      "Sí, si avisa por un mensaje",
      "No: fianza y renta tienen funciones distintas; hay que revisar el acuerdo",
      "Sí, siempre que entregue las llaves",
    ],
    correct: 1,
    explanation:
      "Entregar una fianza no significa, por sí solo, que se haya pactado aplicarla al último mes. Es necesario revisar el contrato, los pagos y cualquier acuerdo entre las partes. No se calcula aquí deuda, compensación ni importe a devolver.",
    hint: "Una garantía no es, por su nombre, un recibo del último mes.",
    myth: "Ya hay dinero en alguna parte: mi contabilidad es muy creativa.",
    exhibit:
      "Documentos ficticios: recibo de fianza y contrato, sin acuerdo de aplicación al último mes.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Ley de Arrendamientos Urbanos",
        reference: "Arts. 17 y 36",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-08",
    slug: "cerradura-alquiler",
    level: 2,
    scene: "plaza",
    topic: "Vivienda",
    title: "Cambiar la cerradura no es un procedimiento",
    prompt:
      "Trampín afirma que el impago de una renta autoriza siempre al arrendador a cambiar la cerradura sin más. ¿Qué respuesta evita convertir un conflicto en otro?",
    options: [
      "Sí, porque ser propietario permite cualquier medio",
      "Sí, si se hace durante el día",
      "No puede presumirse esa autorización: hay que acudir a las vías aplicables",
    ],
    correct: 2,
    explanation:
      "Un impago no permite dar por autorizada cualquier actuación por cuenta propia. La recuperación de la posesión debe analizarse según las vías y garantías aplicables. Este ejercicio no determina delitos, medidas concretas ni el resultado de un procedimiento.",
    hint: "Distingue reclamar un derecho de elegir cualquier medio para hacerlo.",
    myth: "Una llave no sustituye un procedimiento. Menudo fallo de diseño.",
    exhibit:
      "Supuesto ficticio: arrendamiento en vigor y desacuerdo sobre una renta.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Ley de Enjuiciamiento Civil",
        reference:
          "Art. 250.1.1 · procedimientos de recuperación de la posesión",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2000-323",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-09",
    slug: "consentimiento-rgpd",
    level: 2,
    scene: "biblioteca",
    topic: "Protección de datos",
    title: "El consentimiento no es la única base",
    prompt:
      "Lexi pregunta qué puede justificar el tratamiento de datos personales. Trampín responde: «Únicamente el consentimiento, en todos los casos». ¿Es exacto?",
    options: [
      "No: existen otras bases, cuya aplicación debe justificarse",
      "Sí: sin una casilla marcada todo tratamiento está prohibido",
      "Sí: un contrato nunca puede ser relevante",
    ],
    correct: 0,
    explanation:
      "El RGPD contempla distintas bases de licitud, no solo el consentimiento. No se pueden intercambiar a conveniencia: hace falta identificar una base aplicable y cumplir los demás requisitos. No se decide aquí la base de un tratamiento real.",
    hint: "Busca la diferencia entre una base posible y la única base existente.",
    myth: "¿Una casilla y ya está todo resuelto? Ni mi robot se lo cree.",
    exhibit:
      "Ficha ficticia: se pregunta por bases de licitud, sin describir un tratamiento real.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Reglamento (UE) 2016/679, RGPD",
        reference: "Art. 6.1",
        url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-10",
    slug: "captura-prueba",
    level: 2,
    scene: "biblioteca",
    topic: "Prueba digital",
    title: "La captura milagrosa",
    prompt:
      "Elion tiene una captura de un chat. Trampín sostiene que prueba definitivamente todo lo que aparece en ella. ¿Qué necesita una revisión profesional?",
    options: [
      "Solo que se lea el nombre del contacto",
      "Su contexto, integridad, autenticidad y relación con los hechos",
      "Solo que el archivo esté en formato PNG",
    ],
    correct: 1,
    explanation:
      "Una captura puede aportar información, pero su valoración no depende solo de su apariencia. El origen, el contexto, las posibles impugnaciones y los restantes elementos deben revisarse conforme al medio de prueba. No se atribuye aquí valor probatorio definitivo.",
    hint: "Una imagen aislada puede omitir el origen y la conversación completa.",
    myth: "Le he añadido un borde solemne. ¡Ahora parece irrefutable!",
    exhibit:
      "Documento ficticio: captura parcial, sin conversación completa ni comprobación del origen.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Ley de Enjuiciamiento Civil",
        reference: "Arts. 299, 326 y 382–384 · según el medio de prueba",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2000-323",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-11",
    slug: "clausula-firma",
    level: 3,
    scene: "plaza",
    topic: "Contratos",
    title: "Firmado no significa intocable",
    prompt:
      "Un contrato ficticio de vivienda incluye una cláusula que reduce derechos reconocidos por normas imperativas. «Está firmada, así que siempre vale», dice Trampín. ¿Qué exige el matiz?",
    options: [
      "Contar cuántas firmas tiene",
      "Dar prioridad a cualquier cláusula impresa",
      "Revisar la cláusula frente a las normas que no pueden excluirse por pacto",
    ],
    correct: 2,
    explanation:
      "La firma no hace válida automáticamente toda estipulación. En arrendamientos de vivienda hay reglas sobre cláusulas perjudiciales para el arrendatario dentro de su ámbito. Deben revisarse el régimen y la redacción exactos antes de concluir si una cláusula es nula.",
    hint: "La libertad de pactar tiene límites; el supuesto y la norma concreta importan.",
    myth: "La impresora no fabrica normas imperativas. Lo he comprobado.",
    exhibit:
      "Fragmento ficticio: «La firma convalida cualquier renuncia, aunque la ley la prohíba».",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Ley de Arrendamientos Urbanos",
        reference: "Art. 6",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-12",
    slug: "herencia-deudas",
    level: 3,
    scene: "jardin",
    topic: "Sucesiones",
    title: "La herencia no es solo una lista de bienes",
    prompt:
      "Lúmina encuentra una relación de bienes y deudas de una persona fallecida. Trampín propone ignorar las deudas porque «no se heredan papeles desagradables». ¿Qué conviene distinguir?",
    options: [
      "El contenido de la herencia y los efectos de la forma de aceptación",
      "Solo los bienes que caben en una fotografía",
      "Que todas las obligaciones desaparecen siempre con el fallecimiento",
    ],
    correct: 0,
    explanation:
      "La herencia puede comprender bienes, derechos y obligaciones que no se extingan por la muerte. Los efectos de la aceptación y los límites de responsabilidad exigen revisar el régimen aplicable. No se aconseja aceptar o repudiar una herencia concreta.",
    hint: "Distingue qué integra una herencia de cómo se acepta y con qué efectos.",
    myth: "He filtrado la hoja de cálculo por “cosas bonitas”. No es un análisis sucesorio.",
    exhibit:
      "Inventario ficticio: bienes y obligaciones pendientes, sin decisión sobre aceptación.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Código Civil",
        reference: "Arts. 659, 1003 y 1023",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-13",
    slug: "retirar-consentimiento",
    level: 3,
    scene: "biblioteca",
    topic: "Protección de datos",
    title: "Retirar no es borrar el pasado automáticamente",
    prompt:
      "Aura retira un consentimiento para un tratamiento de datos. Trampín dice que eso vuelve ilícito automáticamente todo tratamiento anterior. ¿Qué diferencia señala el RGPD?",
    options: [
      "No permite retirar el consentimiento nunca",
      "La retirada no afecta por sí misma a la licitud anterior basada en el consentimiento",
      "Solo puede retirarse con permiso de quien trata los datos",
    ],
    correct: 1,
    explanation:
      "El RGPD distingue la retirada del consentimiento de la licitud del tratamiento basado en él antes de retirarlo. Los efectos posteriores, la supresión y otras bases o deberes requieren análisis separado. No se resuelve aquí una solicitud real de derechos.",
    hint: "Distingue los efectos hacia adelante de la valoración del tratamiento anterior.",
    myth: "Mi botón de deshacer viaja en el tiempo. El RGPD hace más distinciones.",
    exhibit:
      "Solicitud ficticia: retirada de consentimiento, sin información sobre otros deberes o bases.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Reglamento (UE) 2016/679, RGPD",
        reference: "Art. 7.3",
        url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-14",
    slug: "comunicacion-fecha",
    level: 3,
    scene: "biblioteca",
    topic: "Procedimiento",
    title: "Una fecha no te cuenta todo el plazo",
    prompt:
      "Brinco recibe una comunicación con una fecha. Trampín calcula el vencimiento sin leer el documento ni comprobar su recepción. ¿Qué falta antes de confirmarlo?",
    options: [
      "Únicamente mirar si cae en viernes",
      "Nada, cualquier fecha inicia el mismo cómputo",
      "Identificar el trámite, la notificación y las reglas de cómputo aplicables",
    ],
    correct: 2,
    explanation:
      "Una fecha aislada no basta para confirmar un vencimiento. Es necesario identificar el procedimiento, la forma y momento de la comunicación y las reglas aplicables. Esta herramienta no calcula plazos: si existe uno indicado, conviene revisión profesional de la documentación.",
    hint: "No confundas la fecha impresa con todos los datos necesarios para un cómputo.",
    myth: "He sumado números al calendario. Todavía me falta leer la comunicación.",
    exhibit:
      "Comunicación ficticia con fecha, sin datos suficientes para confirmar notificación ni trámite.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title: "Ley de Enjuiciamiento Civil",
        reference:
          "Arts. 130–136 · solo como referencia de contraste en proceso civil",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2000-323",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
  {
    id: "legal-demo-15",
    slug: "publicidad-vincula",
    level: 3,
    scene: "jardin",
    topic: "Consumo",
    title: "La oferta también se lee",
    prompt:
      "Lexi conserva un anuncio con prestaciones concretas que no aparecen en el resumen de un contrato de consumo. Trampín asegura que el anuncio nunca importa. ¿Qué debe revisarse?",
    options: [
      "La posible integración de la oferta y publicidad en el contrato",
      "Solo la tipografía del contrato",
      "Nada que se haya publicado antes de firmar",
    ],
    correct: 0,
    explanation:
      "La normativa de consumo contempla la integración de la oferta, promoción y publicidad en el contrato, con sus condiciones y matices. Deben revisarse el anuncio, el contrato y el supuesto aplicable; no se afirma aquí un incumplimiento ni una indemnización.",
    hint: "Conserva la oferta y distingue publicidad concreta de una conclusión sobre el caso.",
    myth: "“Eso solo era el anuncio” no es un comodín jurídico.",
    exhibit:
      "Documentos ficticios: oferta comercial conservada y resumen contractual para comparar.",
    status: "demo",
    jurisdiction: "España y UE · propuesta pendiente de confirmar",
    sources: [
      {
        title:
          "Texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios",
        reference: "Art. 61",
        url: "https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555",
        verification: "pending",
      },
    ],
    review: {
      reviewer: null,
      date: null,
      vincentVerified: false,
    },
  },
];
