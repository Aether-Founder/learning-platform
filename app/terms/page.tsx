import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold">Algemene Voorwaarden</h1>
      <p className="mt-4 text-sm text-muted-foreground">Laatst bijgewerkt: 26 oktober 2023</p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptatie van Voorwaarden</h2>
          <p className="mt-2">
            Door toegang te krijgen tot of gebruik te maken van <strong>Trellis</strong> ("de Dienst"), stem je ermee in gebonden te zijn door deze Algemene Voorwaarden. Als je het niet eens bent met enig deel van de voorwaarden, mag je geen gebruikmaken van de dienst.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Beschrijving van de Dienst</h2>
          <p className="mt-2">
            Trellis is een Student Besturingssysteem dat life management (agenda, taken) combineert met een Learning Management System (flashcards, aantekeningen). Belangrijkste functies zijn onder andere:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Artisan AI:</strong> Een asynchrone synthese-engine die geüploade materialen (PDF's) verwerkt met behulp van lokale of cloud-gebaseerde Large Language Models (LLM's) om outlines en flashcards te genereren.</li>
            <li><strong>FSRS Engine:</strong> Een spaced repetition algoritme dat herhalingen plant op basis van geheugenstabiliteit en moeilijkheidsgraad.</li>
            <li><strong>Local-First Architectuur:</strong> Gegevens worden lokaal in je browser gecachet maar gesynchroniseerd met Supabase cloud-opslag voor back-up en multi-device toegang.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Gebruikersaccounts & Veiligheid</h2>
          <p className="mt-2">
            Je bent verantwoordelijk voor het beveiligen van je accountgegevens. Je gaat ermee akkoord verantwoordelijkheid te aanvaarden voor alle activiteiten die onder jouw account plaatsvinden. Wij gebruiken Supabase Auth voor authenticatie; wij slaan nooit je raw wachtwoord op.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Intellectueel Eigendom & Content Eigendom</h2>
          <p className="mt-2">
            <strong>Jouw Content:</strong> Je behoudt alle rechten op de materialen die je uploadt (PDF's, aantekeningen, flashcards). Je verleent Trellis een beperkte licentie om deze content op te slaan, te verwerken en weer te geven uitsluitend met het doel de Dienst te verlenen (bijv. het genereren van flashcards uit je PDF).
          </p>
          <p className="mt-2">
            <strong>AI Outputs:</strong> Content gegenereerd door Artisan AI (outlines, samenvattingen) is afgeleid van jouw input. Jij bezit de output, maar je erkent dat AI-generatie onnauwkeurigheden kan bevatten ("hallucinaties"). Je bent verantwoordelijk voor het verifiëren van de nauwkeurigheid van alle studiematerialen voordat je erop vertrouwt voor academische doeleinden.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Aanvaardbaar Gebruik</h2>
          <p className="mt-2">Je gaat ermee akkoord NIET om:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Schadelijke bestanden, virussen of materiaal waarvan je geen auteursrecht hebt om te delen, te uploaden.</li>
            <li>Reverse engineering van de Artisan AI bridge uit te voeren of te proberen rate limits op het webhook-systeem te omzeilen.</li>
            <li>De dienst te gebruiken om te cheatsten, plagiaat te plegen, of het integriteitsbeleid van je instelling te schenden.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Disclaimer van Garanties</h2>
          <p className="mt-2">
            DE DIENST WORDT GELEVERD "AS IS" ZONDER ENIGE GARANTIE. WIJ GARANDEREN NIET DAT:
          </p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Het FSRS-algoritme specifieke academische resultaten of geheugenbehoud zal garanderen.</li>
            <li>De Artisan AI altijd 100% nauwkeurige feitelijke informatie zal produceren.</li>
            <li>De dienst ononderbroken, veilig of foutloos zal zijn.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Aansprakelijkheidsbeperking</h2>
          <p className="mt-2">
            VOOR ZOVER TOEGESTAAN DOOR DE WET, IS TRELLIS NIET AANSPRAKELIJK VOOR ENIGE INDIRECTE, INCIDENTELE OF GEVOLGSCHADE, INCLUSIEF VERLIES VAN GEGEVENS, VERLIES VAN WINST, OF HET NIET BEREIKEN VAN GEWENSTE CIJFERS ALS GEVOLG VAN HET GEBRUIK VAN ONZE SPACED REPETITION PLANNING OF AI SAMENVATTINGEN.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Wijzigingen in Voorwaarden</h2>
          <p className="mt-2">
            Wij behouden ons het recht voor om deze voorwaarden op elk moment te wijzigen. Voortgezet gebruik van de dienst na wijzigingen vormt acceptatie van de nieuwe voorwaarden.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Contact</h2>
          <p className="mt-2">
            Voor vragen over deze voorwaarden, neem contact met ons op via support@trellis.study.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          &larr; Terug naar dashboard
        </Link>
      </div>
    </div>
  );
}
