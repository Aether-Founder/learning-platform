import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-semibold">Privacybeleid</h1>
      <p className="mt-4 text-sm text-muted-foreground">Laatst bijgewerkt: 26 oktober 2023</p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Introductie</h2>
          <p className="mt-2">
            Bij <strong>Trellis</strong> geloven we dat jouw studiagegevens van jou zijn. Dit beleid legt uit hoe wij jouw informatie verzamelen, gebruiken en beschermen wanneer je gebruikmaakt van ons Student OS en Artisan AI-functies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Informatie die Wij Verzamelen</h2>
          
          <h3 className="mt-4 font-medium text-foreground">A. Informatie die Jij Verstrekt</h3>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Accountgegevens:</strong> E-mailadres en authenticatietokens (via Supabase Auth).</li>
            <li><strong>Studiematerialen:</strong> PDF's, documenten en URL's die je uploadt voor AI-verwerking.</li>
            <li><strong>Kennisgegevens:</strong> Flashcards, aantekeningen en outlines die je maakt of genereert.</li>
            <li><strong>Prestatiegegevens:</strong> FSRS-metrieke waarden (stabiliteit, moeilijkheidsgraad, review-geschiedenis) en agenda-evenementen.</li>
          </ul>

          <h3 className="mt-4 font-medium text-foreground">B. Geautomatiseerde Gegevens</h3>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Gebruikslogs:</strong> Wij loggen job-statusupdates (bijv. "AI-verwerking gestart") om real-time feedback te bieden.</li>
            <li><strong>Apparaatinformatie:</strong> Basis browsertype en OS-versie voor compatibiliteitscontroles.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Hoe Wij Jouw Gegevens Gebruiken</h2>
          <p className="mt-2">Wij gebruiken jouw gegevens uitsluitend om de Dienst te verlenen:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Voor Artisan AI:</strong> Wanneer je een PDF uploadt, verwerken wij deze tijdelijk om tekst te extraheren en flashcards te genereren. Deze tekst wordt naar de AI-engine gestuurd (lokaal via tunnel of cloud) uitsluitend voor synthese.</li>
            <li><strong>Voor Review Planning:</strong> Wij gebruiken je review-geschiedenis om het FSRS-algoritme uit te voeren en te bepalen welke kaarten vandaag verschuldigd zijn.</li>
            <li><strong>Voor Sync Tussen Apparaten:</strong> Jouw gegevens worden opgeslagen in Supabase (PostgreSQL) om naadloze toegang mogelijk te maken vanaf je laptop, tablet en telefoon.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Gegevensopslag & Beveiliging</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Provider:</strong> Alle gegevens worden gehost op <strong>Supabase</strong> (AWS-infrastructuur), compliant met SOC 2 en GDPR-standaarden.</li>
            <li><strong>Versleuteling:</strong> Gegevens worden versleuteld tijdens transport (TLS/SSL) en in rust.</li>
            <li><strong>Local-First:</strong> Hoewel wij synchroniseren met de cloud, bevindt een kopie van jouw gegevens zich in je browser's IndexedDB. Wij hebben geen toegang tot je lokale apparaatopslag buiten wat je expliciet synchroniseert.</li>
            <li><strong>AI-verwerking:</strong> Voor gebruikers die de "Local Bridge" draaien, worden jouw PDF's verwerkt op je eigen hardware. Voor cloud-gebruikers worden gegevens tijdelijk verwerkt en niet gebruikt om publieke modellen te trainen.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Delen met Derden</h2>
          <p className="mt-2 font-medium">Wij verkopen jouw gegevens niet.</p>
          <p className="mt-2">Wij delen gegevens alleen met:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Supabase:</strong> Voor database- en opslaghosting.</li>
            <li><strong>AI-providers:</strong> Als je onze gehoste AI gebruikt (niet lokaal), wordt tekst naar een LLM-provider (bijv. OpenAI of een self-hosted instantie) gestuurd strikt voor inferentie. Wij staan deze providers niet toe om jouw gegevens op te slaan voor training.</li>
            <li><strong>Wettelijke Vereisten:</strong> Alleen indien vereist door de wet of om de veiligheid van onze gebruikers te beschermen.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Jouw Rechten</h2>
          <p className="mt-2">Je hebt het recht om:</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li><strong>Toegang:</strong> Download al jouw gegevens (aantekeningen, kaarten, logs) op elk moment.</li>
            <li><strong>Verwijdering:</strong> Permanent je account en alle bijbehorende gegevens verwijderen. Deze actie is onomkeerbaar.</li>
            <li><strong>Correctie:</strong> Bewerk enige onjuiste informatie in je profiel of aantekeningen.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Privacy van Kinderen</h2>
          <p className="mt-2">
            Onze dienst is bedoeld voor studenten van 13 jaar en ouder. Wij verzamelen niet bewust persoonlijke informatie van kinderen onder de 13 zonder ouderlijke toestemming.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Cookies</h2>
          <p className="mt-2">
            Wij gebruiken essentiële cookies om je login-sessie te onderhouden (Supabase Auth). Wij gebruiken geen tracking-cookies voor reclamedoeleinden.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Contact Ons</h2>
          <p className="mt-2">
            Als je vragen hebt over dit beleid of jouw gegevens wilt verwijderen, neem dan contact met ons op via privacy@trellis.study.
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
