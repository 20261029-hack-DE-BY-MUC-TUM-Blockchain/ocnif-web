import type { DeckCopy } from "./en";
export const deckGerman: DeckCopy = {
  event: "TUM Blockchain & AI Hackathon · 31. Oktober 2026",
  live: "Live-Produkt",
  architecture: "Systemarchitektur",
  workflow: "Nutzerablauf",
  capture: "Echte Aufnahme der Anwendung",
  diagram: "Architekturdiagramm",
  capturedSteps: "Vorschau der aufgenommenen Schritte",
  previewNote:
    "Zeitgestempelte Screenshots echter Interaktionen, zu einer kurzen Vorschau zusammengestellt. Dies ist keine durchgehende Bildschirmaufnahme.",
  captureLanguage:
    "Die Abbildungen behalten die englische Oberfläche und die englischen Architekturbeschriftungen bei.",
  playPreview: "Aufgenommene Schritte abspielen",
  pausePreview: "Vorschau pausieren",
  openVisual: "Grafik in voller Größe öffnen",
  navigation: "Präsentationsnavigation",
  contents: "Folie auswählen",
  keyboard: "← → zum Navigieren · Pos1 / Ende",
  snapshot: "Nachweisstand · 31. Oktober 2026",
  verified: "Beobachtet",
  pending: "Noch zu überprüfen",
  designed: "Implementierter Ablauf",
  heroTitle: "Ein Sicherheitsteam, dem Sie Fragen stellen können.",
  heroBody:
    "Ocnif macht aus bereitgestellten Belegen eine überprüfbare Bewertung – mit spezialisierten Agenten, sichtbaren Werkzeugaktivitäten und einer menschlichen Entscheidung am Ende.",
  heroCaption:
    "Der bereitgestellte Ocnif-Arbeitsbereich: Gespräch, Befunde, Aktivitäten und Dienststatus an einem Ort.",
  heroPoint1: "In natürlicher Sprache untersuchen",
  heroPoint2: "Die Belege hinter der Antwort prüfen",
  heroPoint3: "Veröffentlichung und Wallet-Aktionen getrennt freigeben",
  problemTitle:
    "Von verstreuten Signalen zu einer handlungsrelevanten Bewertung.",
  problemBody:
    "Für kleine Sicherheitsteams, Plattformingenieure und Organisationen, die ihre Angriffsfläche verstehen möchten, ohne eine weitere Warteschlange für Warnungen einzuführen.",
  problem1Title: "Der Kontext ist verstreut",
  problem1Body:
    "Header, Protokolle, verdächtige Nachrichten und Fragen kommen an unterschiedlichen Stellen an.",
  problem2Title: "Antworten müssen nachvollziehbar sein",
  problem2Body:
    "Teams müssen sehen, was ein Agent getan hat, welche Belege einen Befund stützen und was weiterhin ungewiss ist.",
  problem3Title: "Jede Aktion braucht eine verantwortliche Person",
  problem3Body:
    "Berichtsannahme, öffentliche Freigabe, Zahlung und Vertragstransaktionen benötigen jeweils eine ausdrückliche menschliche Entscheidung.",
  workflowTitle: "Ein Gespräch. Eine sichtbare Folge von Arbeitsschritten.",
  workflowBody:
    "Belege bereitstellen, eine Aufgabe wählen, spezialisierte Agenten steuern und das Ergebnis prüfen. Veröffentlichung und Netzwerkabläufe haben eigene Freigabeschritte.",
  workflowCaption:
    "Der gesamte Nutzerablauf mit den Entscheidungspunkten zwischen Bewertung, Veröffentlichung und Zahlung.",
  workflowNote:
    "Die Bewertung beschränkt sich auf die vom Nutzer bereitgestellten Belege. Diese Demo belegt keinen autorisierten Scan eines externen Systems.",
  assessmentTitle: "Verfolgen Sie, wie eine Bewertung entsteht.",
  assessmentBody:
    "Eine echte Anfrage erzeugt laufende Agenten- und Werkzeugereignisse, eine schriftliche Antwort und strukturierte Befunde. Nutzer können die laufende Aufgabe steuern oder abbrechen.",
  assessmentCaption:
    "In der bereitgestellten Anwendung mit einer begrenzten Anfrage zu synthetischen Sicherheitsbelegen aufgenommen.",
  assessmentNote:
    "Die Belege sind synthetisch; die Interaktion mit der Anwendung und die Modellausführung sind echt.",
  architectureTitle: "Gemeinsame Verarbeitung. Klare Vertrauensgrenzen.",
  architectureBody:
    "Der Web-Arbeitsbereich verbindet sich mit einem Rust-Backend und einer gemeinsamen Modelllaufzeit. Persistenz, Sprache und Sponsorenadapter haben getrennte Zuständigkeiten.",
  architectureCaption:
    "Wie Anwendung, Agentenlaufzeit, Datenspeicher, optionale Sprachdienste und die drei Netzwerkintegrationen zusammenwirken.",
  architectureNote:
    "Anbieterzugangsdaten bleiben auf dem Server. Browser-Wallets behalten ihre Schlüssel und benötigen die Zustimmung des Nutzers.",
  reportTitle: "Ein Befund wird nützlich, wenn er überprüfbar ist.",
  reportBody:
    "Strukturierte Karten machen die Bewertung lesbar. Aktivitätsereignisse halten den zugrunde liegenden Ablauf fest. Der Nutzer prüft den Bericht und entscheidet getrennt über seine Veröffentlichung.",
  reportCaption:
    "Ein tatsächlich erzeugter Bericht mit Prüfoptionen im Ocnif-Arbeitsbereich.",
  reportNote:
    "Die Annahme eines Berichts dokumentiert eine Entscheidung im Arbeitsbereich. Sie belegt keine Fehlerbehebung, veröffentlicht nichts automatisch und führt keine Zahlung aus.",
  cardanoTitle: "Cardano: eine bezahlte Agentenaufgabe mit Beleg.",
  cardanoBody:
    "Sokosumi stellt den Aufgabenablauf im persönlichen Arbeitsbereich bereit. Masumi koordiniert den Zahlungszyklus auf Cardano Preprod, während der Ocnif-Worker die angeforderte Sicherheitsaufgabe ausführt.",
  cardanoCaption:
    "Die gewählte Integration von Masumi + Sokosumi: von der Aufgabenerstellung über die Ergebniseinreichung bis zur späteren Auszahlung an den Verkäufer.",
  cardanoStatus:
    "Bezahlte Aufgabe im persönlichen Arbeitsbereich abgeschlossen · Auszahlung an den Verkäufer bestätigt",
  cardanoProofTitle: "Jeden Zahlungsschritt sichtbar machen.",
  cardanoProofBody:
    "Eine abgeschlossene Aufgabe, gesperrte Mittel, ein eingereichtes Ergebnis und eine Auszahlung an den Verkäufer sind unterschiedliche Ereignisse. Die Präsentation trennt ihre Nachweise.",
  cardanoProofCaption:
    "Echte Schritte in der Oberfläche. Der Cloud-Bereich zeigt die Bereitschaft für die reine Aufgabenausführung; die separat verifizierte bezahlte persönliche Aufgabe lief über den nativen Ocnif-Worker. Private Kennungen werden ausgelassen.",
  cardanoProofNote:
    "Beobachtet: 1 Test-USDM / 100 Credits; FundsLocked, ResultSubmitted und Auszahlung an den Verkäufer bestätigt. Nettoeingang beim Verkäufer: +1 Test-USDM. Das Ergebnis im persönlichen Arbeitsbereich belegt kein Ergebnis in einem Organisationsarbeitsbereich.",
  api3Title:
    "API3: signierte Belege vor einer Entscheidung auf der Blockchain.",
  api3Body:
    "Eine NVD-Schwachstellenattestierung anfordern, die Zahlungsbedingungen auf Base Sepolia prüfen und die signierte Antwort verifizieren, bevor eine Transaktion mit dem Prüfvertrag separat freigegeben wird.",
  api3Caption:
    "Die x402-Zahlungsanforderung und der EIP-3009-Zahlungsablauf, die Verifikation signierter NVD-Belege und die Entscheidung anhand einer CVSS-Richtlinie.",
  api3Status:
    "Echte unbezahlte Zahlungsanforderung geprüft · bezahlte Attestierung und Vertragsausführung ausstehend",
  api3ProofTitle: "Genauen CVE, Empfänger und Richtlinie prüfen.",
  api3ProofBody:
    "Die Oberfläche bindet die Freigabe an den ausgewählten CVE und bewahrt frühere Zahlungsversuche auf. Ein anderer CVE macht die vorherige Prüfung ungültig; ungewisse Ergebnisse können nicht unbemerkt eine neue Zahlung auslösen.",
  api3ProofCaption:
    "Echte Schritte in der API3-Oberfläche. Die Vorschau behauptet weder eine abgeschlossene Zahlung noch die Bereitstellung eines Prüfvertrags.",
  api3ProofNote:
    "Base Sepolia verwendet das in der Zahlungsanforderung angegebene aUSD-Asset. Wallet-Signaturen, Gas für die Bereitstellung, Aktualität der Belege und CVSS-Schwellenwert werden getrennt geprüft.",
  bsvTitle: "BSV: einen Bericht kaufen oder einen Berichtspass übertragen.",
  bsvBody:
    "Ein veröffentlichter Bericht kann über einen BRC-121-Kauf oder einen registrierten BSV-21-Pass zugänglich sein. Der vom Overlay geprüfte Besitz steuert den Passzugriff; ein atomarer Tausch erfordert die Prüfung des Angebots durch beide Parteien.",
  bsvCaption:
    "Berichtsveröffentlichung, ausdrückliche Zahlungs- oder Mint-Freigabe, Overlay-Aufnahme, Besitzprüfung und der Tausch zwischen zwei Wallets.",
  bsvStatus:
    "Overlay und Herausgeber konfiguriert · Ausführung mit echten Wallets ausstehend",
  bsvProofTitle: "Die Wallet bleibt unter der Kontrolle des Nutzers.",
  bsvProofBody:
    "Die Oberfläche prüft das konfigurierte Netzwerk, den Berichts-Hash, Empfänger, Betrag und Inhaber. Eine gespeicherte Transaktion mit ungewissem Ergebnis kann abgeglichen werden, ohne erneut zu prägen oder zu zahlen.",
  bsvProofCaption:
    "Echte Schritte und Einrichtungszustände in der BSV-Oberfläche. Diese Vorschau behauptet keinen tatsächlich finanzierten Kauf, Mint, Tausch oder eine Blockchain-Bestätigung.",
  bsvProofNote:
    "Die Aufnahme in das Overlay ist keine Blockbestätigung. Jeder neue Pass hat eine feste Menge von eins, doch das Prägen macht den Bericht nicht weltweit einzigartig. Direkte Berichtskäufe erfordern weiterhin die Einrichtung des Händler-Wallets.",
  closingTitle: "Produkt ausprobieren. Nachweise prüfen.",
  closingBody:
    "Der nächste Schritt ist ein Pilot mit einem echten Team: eine begrenzte Menge an Belegen bereitstellen, die Bewertung prüfen und beurteilen, ob der Ablauf die Arbeit zwischen einem Signal und einer Entscheidung reduziert.",
  deliveredTitle: "Zur Bewertung verfügbar",
  deliveredBody:
    "Bereitgestellter Arbeitsbereich; echte Agentenläufe; gespeicherte Nachrichten und Ereignisse; strukturierte Berichte; ausdrückliche Freigaben für Veröffentlichung und Zahlung; Oberfläche in vier Sprachen.",
  provenTitle: "In begrenzten Prüfungen bestätigt",
  provenBody:
    "Echte Cloud-Bewertung und synthetischer WebRTC-Ablauf; bezahlte persönliche Cardano-Aufgabe mit bestätigter Auszahlung; unbezahlte API3-Zahlungsanforderung; BSV-SDK und Abläufe auf einer simulierten Blockchain.",
  nextTitle: "Nächste Abnahmeprüfungen",
  nextBody:
    "Echte Wallet-Ausführung für API3 und BSV; Abnahme mit nativem Mikrofon und assistiven Technologien; vollständige Modell- und Sprachabläufe in allen vier Sprachen.",
  closingNote:
    "Dies ist eine Hackathon-Implementierung mit einem Nachweisstand, keine Behauptung, dass die gesamte Roadmap oder alle Integrationsabläufe abgeschlossen sind.",
  openWorkspace: "Live-Arbeitsbereich öffnen",
  openPayments: "Netzwerkabläufe prüfen",
};
