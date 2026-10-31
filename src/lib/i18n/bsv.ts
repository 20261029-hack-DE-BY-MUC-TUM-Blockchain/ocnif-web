import type { Locale } from "../types/runtime";

export const bsvEnglish = {
  title: "Published reports and transferable access passes",
  intro:
    "Buy a published report with BSV, or use a registered pass while you hold its admitted token output. Each wallet action requires your review.",
  configured: "Configured",
  setup: "Setup required",
  checking: "Checking BSV service…",
  unavailable:
    "BSV service is unavailable. Check the configured overlay and refresh.",
  readiness: "Service configuration",
  merchant: "Report-payment merchant",
  issuer: "Pass issuer",
  readinessNote:
    "Configured identities do not prove funding, available reports, offers or block confirmation.",
  load: "Load this published report",
  loadNote:
    "Use a report identifier returned by an approved /publish request. Connect your wallet to restore any saved operation before loading new terms.",
  requestFailed:
    "This operation could not be verified. Review service setup, the report identifier, your wallet and the saved operation before continuing.",
  purchase: "Review a direct report purchase",
  buy: "Approve this report payment in wallet",
  buyNote:
    "The exact recipient, report digest and amount below are approved. Network fees are additional and reviewed in your wallet. Delivery is checked against the report digest.",
  expires: "Terms expire",
  digest: "Published report SHA256",
  saved: "Saved operation",
  savedNote:
    "This report already has a recorded operation for this wallet. A second payment or mint is blocked. Inspect wallet history and the saved proof; an uncertain result is not permission to pay again.",
  inspect: "Inspect the saved operation",
  mint: "Review a new report access pass",
  mintNote:
    "Create one transferable OCNIF token with zero decimals, bound to this report digest. This spends one token satoshi plus wallet fees. Each mint creates a new token; this does not guarantee a globally unique pass for the report.",
  mintApprove: "Approve this pass mint in wallet",
  issuerOnly:
    "Minting requires the configured issuer wallet on the matching network.",
  reconcile: "Reconcile the same minted transaction",
  register: "Sign issuer registration for this pass",
  registered: "Pass registration verified by the service",
  registrationNote:
    "Minting alone does not grant report access. The service must accept the issuer registration after validating the admitted token and report commitment.",
  access: "Use a held report pass",
  keyIndex: "Token key index",
  accessReview: "Check ownership and review access proof",
  accessApprove: "Sign this holder proof and open the report",
  accessNote:
    "The service checks that this registered output is unspent and belongs to your wallet. Access follows the current holder; transferring the token removes the previous holder’s access.",
  accessVerified: "Current pass ownership verified by the overlay",
  merchantAccepted: "Merchant accepted the report payment",
  unconfirmed: "This evidence does not establish block confirmation.",
  report: "Delivered published report",
  list: "Offer this held pass for sale",
  listReview: "Review this listing",
  listApprove: "Sign and publish this exact listing",
  listed: "Listing accepted by the service",
  listNote:
    "Listing signs public terms and does not move funds. Both counterparties must still approve the atomic swap. Listings have no automatic expiry, escrow or cancellation.",
  offers: "Current report-pass offers",
  noOffers: "No current offers were returned by the service.",
  offerReview: "Review this offer as buyer",
  swap: "Complete the atomic wallet exchange",
  transferNote:
    "After a transfer, use its output and your token key index to request fresh holder access. A broadcast receipt alone does not grant access.",
};
type BsvCopy = { [Key in keyof typeof bsvEnglish]: string };
export const bsvCopy: Record<Locale, BsvCopy> = {
  en: bsvEnglish,
  es: {
    title: "Informes publicados y pases de acceso transferibles",
    intro:
      "Compra un informe publicado con BSV o usa un pase registrado mientras poseas la salida de token admitida. Debes revisar cada acción de la cartera.",
    configured: "Configurado",
    setup: "Configuración pendiente",
    checking: "Comprobando el servicio BSV…",
    unavailable:
      "El servicio BSV no está disponible. Comprueba el overlay configurado y actualiza.",
    readiness: "Configuración del servicio",
    merchant: "Comerciante de pagos por informes",
    issuer: "Emisor de pases",
    readinessNote:
      "Las identidades configuradas no demuestran que haya fondos, informes disponibles, ofertas o confirmación en un bloque.",
    load: "Cargar este informe publicado",
    loadNote:
      "Usa el identificador de informe devuelto por una solicitud /publish aprobada. Conecta tu cartera para recuperar cualquier operación guardada antes de cargar nuevas condiciones.",
    requestFailed:
      "No se pudo verificar esta operación. Revisa la configuración del servicio, el identificador del informe, tu cartera y la operación guardada antes de continuar.",
    purchase: "Revisar una compra directa del informe",
    buy: "Aprobar este pago del informe en la cartera",
    buyNote:
      "Se aprueban el destinatario, el resumen criptográfico del informe y el importe exactos que aparecen abajo. Las comisiones de red son adicionales y se revisan en tu cartera. La entrega se comprueba con el resumen criptográfico del informe.",
    expires: "Caducidad de las condiciones",
    digest: "SHA256 del informe publicado",
    saved: "Operación guardada",
    savedNote:
      "Este informe ya tiene una operación registrada para esta cartera. Se bloquea un segundo pago o una nueva emisión. Revisa el historial de la cartera y la prueba guardada; un resultado incierto no autoriza a pagar de nuevo.",
    inspect: "Revisar la operación guardada",
    mint: "Revisar un nuevo pase de acceso al informe",
    mintNote:
      "Crea un token OCNIF transferible, sin decimales, vinculado al resumen criptográfico de este informe. Consume un satoshi del token más las comisiones de la cartera. Cada emisión crea un token nuevo; no garantiza un pase globalmente único para el informe.",
    mintApprove: "Aprobar la emisión de este pase en la cartera",
    issuerOnly:
      "La emisión requiere la cartera del emisor configurado en la red correspondiente.",
    reconcile: "Conciliar la misma transacción de emisión",
    register: "Firmar el registro del emisor para este pase",
    registered: "Registro del pase verificado por el servicio",
    registrationNote:
      "Emitir un token no concede por sí solo acceso al informe. El servicio debe aceptar el registro del emisor tras validar el token admitido y su vinculación criptográfica con el informe.",
    access: "Usar un pase de informe en posesión",
    keyIndex: "Índice de clave del token",
    accessReview: "Comprobar la titularidad y revisar la prueba de acceso",
    accessApprove: "Firmar esta prueba de titularidad y abrir el informe",
    accessNote:
      "El servicio comprueba que esta salida registrada no se haya gastado y pertenezca a tu cartera. El acceso corresponde al titular actual; transferir el token retira el acceso al titular anterior.",
    accessVerified: "Titularidad actual del pase verificada por el overlay",
    merchantAccepted: "El comerciante aceptó el pago del informe",
    unconfirmed: "Esta prueba no demuestra la confirmación en un bloque.",
    report: "Informe publicado entregado",
    list: "Poner a la venta este pase en posesión",
    listReview: "Revisar esta oferta",
    listApprove: "Firmar y publicar esta oferta exacta",
    listed: "Oferta aceptada por el servicio",
    listNote:
      "Publicar la oferta firma unas condiciones públicas y no mueve fondos. Ambas partes aún deben aprobar el intercambio atómico. Las ofertas no tienen caducidad automática, depósito en garantía ni cancelación.",
    offers: "Ofertas actuales de pases de informes",
    noOffers: "El servicio no devolvió ninguna oferta actual.",
    offerReview: "Revisar esta oferta como comprador",
    swap: "Completar el intercambio atómico entre carteras",
    transferNote:
      "Tras una transferencia, usa su salida y tu índice de clave del token para solicitar de nuevo acceso como titular. Un comprobante de difusión de la transacción no concede acceso por sí solo.",
  },
  de: {
    title: "Veröffentlichte Berichte und übertragbare Zugangspässe",
    intro:
      "Kaufe einen veröffentlichten Bericht mit BSV oder nutze einen registrierten Pass, solange du dessen zugelassenen Token-Output besitzt. Jede Wallet-Aktion muss von dir geprüft werden.",
    configured: "Konfiguriert",
    setup: "Einrichtung erforderlich",
    checking: "BSV-Dienst wird geprüft…",
    unavailable:
      "Der BSV-Dienst ist nicht verfügbar. Prüfe das konfigurierte Overlay und lade neu.",
    readiness: "Dienstkonfiguration",
    merchant: "Zahlungsempfänger für Berichte",
    issuer: "Pass-Aussteller",
    readinessNote:
      "Konfigurierte Identitäten belegen weder Guthaben noch verfügbare Berichte, Angebote oder eine Blockbestätigung.",
    load: "Diesen veröffentlichten Bericht laden",
    loadNote:
      "Verwende die Berichtskennung aus einer genehmigten /publish-Anfrage. Verbinde deine Wallet, um gespeicherte Vorgänge wiederherzustellen, bevor du neue Bedingungen lädst.",
    requestFailed:
      "Dieser Vorgang konnte nicht verifiziert werden. Prüfe die Dienstkonfiguration, die Berichtskennung, deine Wallet und den gespeicherten Vorgang, bevor du fortfährst.",
    purchase: "Direkten Berichtskauf prüfen",
    buy: "Diese Berichtszahlung in der Wallet genehmigen",
    buyNote:
      "Genehmigt werden der unten angegebene genaue Empfänger, der Berichtshash und der Betrag. Netzwerkgebühren kommen hinzu und werden in deiner Wallet geprüft. Die Lieferung wird anhand des Berichtshashs geprüft.",
    expires: "Bedingungen gültig bis",
    digest: "SHA256 des veröffentlichten Berichts",
    saved: "Gespeicherter Vorgang",
    savedNote:
      "Für diesen Bericht ist bereits ein Vorgang mit dieser Wallet gespeichert. Eine zweite Zahlung oder Token-Erstellung wird blockiert. Prüfe den Wallet-Verlauf und den gespeicherten Nachweis; ein ungewisses Ergebnis erlaubt keine erneute Zahlung.",
    inspect: "Gespeicherten Vorgang prüfen",
    mint: "Neuen Berichtszugangspass prüfen",
    mintNote:
      "Erstelle einen übertragbaren OCNIF-Token ohne Dezimalstellen, der an diesen Berichtshash gebunden ist. Dafür werden ein Token-Satoshi und Wallet-Gebühren ausgegeben. Jede Erstellung erzeugt einen neuen Token; ein weltweit einmaliger Pass für den Bericht wird dadurch nicht garantiert.",
    mintApprove: "Erstellung dieses Passes in der Wallet genehmigen",
    issuerOnly:
      "Die Token-Erstellung erfordert die konfigurierte Aussteller-Wallet im passenden Netzwerk.",
    reconcile: "Dieselbe erstellte Transaktion abgleichen",
    register: "Ausstellerregistrierung für diesen Pass signieren",
    registered: "Pass-Registrierung durch den Dienst verifiziert",
    registrationNote:
      "Die Token-Erstellung allein gewährt keinen Berichtszugang. Der Dienst muss die Ausstellerregistrierung akzeptieren, nachdem er den zugelassenen Token und seine kryptografische Bindung an den Bericht geprüft hat.",
    access: "Einen gehaltenen Berichtspass nutzen",
    keyIndex: "Token-Schlüsselindex",
    accessReview: "Eigentum prüfen und Zugangsnachweis überprüfen",
    accessApprove: "Diesen Eigentumsnachweis signieren und Bericht öffnen",
    accessNote:
      "Der Dienst prüft, ob dieser registrierte Output ungenutzt ist und deiner Wallet gehört. Der Zugang steht dem aktuellen Inhaber zu; eine Token-Übertragung entzieht dem vorherigen Inhaber den Zugang.",
    accessVerified: "Aktuelles Pass-Eigentum durch das Overlay verifiziert",
    merchantAccepted:
      "Der Zahlungsempfänger hat die Berichtszahlung akzeptiert",
    unconfirmed: "Dieser Nachweis belegt keine Blockbestätigung.",
    report: "Gelieferter veröffentlichter Bericht",
    list: "Diesen gehaltenen Pass zum Verkauf anbieten",
    listReview: "Dieses Angebot prüfen",
    listApprove: "Genau dieses Angebot signieren und veröffentlichen",
    listed: "Angebot vom Dienst akzeptiert",
    listNote:
      "Beim Einstellen werden öffentliche Bedingungen signiert; es werden keine Gelder bewegt. Beide Parteien müssen dem atomaren Tausch noch zustimmen. Angebote haben weder automatischen Ablauf noch Treuhandverwahrung oder Stornierung.",
    offers: "Aktuelle Angebote für Berichtspässe",
    noOffers: "Der Dienst hat keine aktuellen Angebote zurückgegeben.",
    offerReview: "Dieses Angebot als Käufer prüfen",
    swap: "Atomaren Wallet-Tausch abschließen",
    transferNote:
      "Nutze nach einer Übertragung deren Output und deinen Token-Schlüsselindex, um einen neuen Zugang als Inhaber anzufordern. Ein Sendebeleg der Transaktion allein gewährt keinen Zugang.",
  },
  fr: {
    title: "Rapports publiés et passes d’accès transférables",
    intro:
      "Achetez un rapport publié avec BSV, ou utilisez un pass enregistré tant que vous détenez sa sortie de jeton admise. Chaque action du portefeuille nécessite votre vérification.",
    configured: "Configuré",
    setup: "Configuration requise",
    checking: "Vérification du service BSV…",
    unavailable:
      "Le service BSV est indisponible. Vérifiez l’overlay configuré et actualisez.",
    readiness: "Configuration du service",
    merchant: "Marchand des paiements de rapports",
    issuer: "Émetteur des passes",
    readinessNote:
      "Des identités configurées ne prouvent ni la présence de fonds, ni la disponibilité de rapports ou d’offres, ni une confirmation dans un bloc.",
    load: "Charger ce rapport publié",
    loadNote:
      "Utilisez l’identifiant du rapport renvoyé par une demande /publish approuvée. Connectez votre portefeuille pour retrouver toute opération enregistrée avant de charger de nouvelles conditions.",
    requestFailed:
      "Cette opération n’a pas pu être vérifiée. Examinez la configuration du service, l’identifiant du rapport, votre portefeuille et l’opération enregistrée avant de continuer.",
    purchase: "Examiner un achat direct du rapport",
    buy: "Approuver ce paiement du rapport dans le portefeuille",
    buyNote:
      "L’approbation porte sur le destinataire, l’empreinte du rapport et le montant exacts indiqués ci-dessous. Les frais de réseau s’ajoutent au montant et sont examinés dans votre portefeuille. La livraison est vérifiée à l’aide de l’empreinte du rapport.",
    expires: "Expiration des conditions",
    digest: "SHA256 du rapport publié",
    saved: "Opération enregistrée",
    savedNote:
      "Une opération est déjà enregistrée pour ce rapport et ce portefeuille. Un second paiement ou une nouvelle émission est bloqué. Examinez l’historique du portefeuille et la preuve enregistrée ; un résultat incertain n’autorise pas un nouveau paiement.",
    inspect: "Examiner l’opération enregistrée",
    mint: "Examiner un nouveau pass d’accès au rapport",
    mintNote:
      "Créez un jeton OCNIF transférable, sans décimales, lié à l’empreinte de ce rapport. Cela dépense un satoshi de jeton, plus les frais du portefeuille. Chaque émission crée un nouveau jeton ; elle ne garantit pas un pass mondialement unique pour ce rapport.",
    mintApprove: "Approuver l’émission de ce pass dans le portefeuille",
    issuerOnly:
      "L’émission nécessite le portefeuille de l’émetteur configuré sur le réseau correspondant.",
    reconcile: "Rapprocher la même transaction d’émission",
    register: "Signer l’enregistrement de l’émetteur pour ce pass",
    registered: "Enregistrement du pass vérifié par le service",
    registrationNote:
      "L’émission seule ne donne pas accès au rapport. Le service doit accepter l’enregistrement de l’émetteur après avoir validé le jeton admis et son engagement cryptographique envers le rapport.",
    access: "Utiliser un pass de rapport détenu",
    keyIndex: "Index de clé du jeton",
    accessReview: "Vérifier la propriété et examiner la preuve d’accès",
    accessApprove: "Signer cette preuve de détention et ouvrir le rapport",
    accessNote:
      "Le service vérifie que cette sortie enregistrée n’a pas été dépensée et appartient à votre portefeuille. L’accès revient au détenteur actuel ; transférer le jeton retire l’accès au détenteur précédent.",
    accessVerified: "Propriété actuelle du pass vérifiée par l’overlay",
    merchantAccepted: "Le marchand a accepté le paiement du rapport",
    unconfirmed: "Cette preuve n’établit pas une confirmation dans un bloc.",
    report: "Rapport publié livré",
    list: "Proposer ce pass détenu à la vente",
    listReview: "Examiner cette offre",
    listApprove: "Signer et publier exactement cette offre",
    listed: "Offre acceptée par le service",
    listNote:
      "La publication signe des conditions publiques et ne déplace aucun fonds. Les deux parties doivent encore approuver l’échange atomique. Les offres n’ont ni expiration automatique, ni séquestre, ni annulation.",
    offers: "Offres actuelles de passes de rapports",
    noOffers: "Le service n’a renvoyé aucune offre actuelle.",
    offerReview: "Examiner cette offre en tant qu’acheteur",
    swap: "Terminer l’échange atomique entre portefeuilles",
    transferNote:
      "Après un transfert, utilisez sa sortie et votre index de clé du jeton pour demander un nouvel accès en tant que détenteur. Un reçu de diffusion de la transaction ne donne pas accès à lui seul.",
  },
};
