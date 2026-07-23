import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function Impressum() {
  return (
    <div className="flex flex-col gap-lg max-w-[800px] mx-auto px-margin py-[60px]">
      <h1 className="font-serif text-headline-lg font-bold">Impressum</h1>
      <h1 className="text-on-surface-variant text-body-lg">
        Angaben gemäß § 5 DDG
      </h1>

      <div className="flex flex-col gap-xs text-body-md">
        <p>DiplomaHub</p>
        <p>Am Lenkert 21B</p>
        <p>53177 Bonn</p>
      </div>

      <div className="flex flex-col gap-xs">
        <h1 className="font-bold text-headline-md">Vertreten durch</h1>
        <p className="text-body-md">Andy Nathan Pieume Tchiyep</p>
      </div>

      <div className="flex flex-col gap-xs">
        <h1 className="font-bold text-headline-md">Kontakt</h1>
        <p className="text-body-md">Telefon: +49-1021003</p>
        <p className="text-body-md">
          E-Mail:{" "}
          <a
            href="mailto:info@diplomahub.org"
            className="text-primary hover:underline"
          >
            info@diplomahub.org
          </a>
        </p>
      </div>

      <div className="flex flex-col gap-xs">
        <h1 className="font-bold text-headline-md">
          Verbraucherstreitbeilegung / Universalschlichtungsstelle
        </h1>
        <p className="text-body-md">
          Wir nehmen nicht an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teil und sind dazu auch nicht
          verpflichtet.
        </p>
      </div>

      <div className="flex flex-col gap-md">
        <h1 className="font-bold text-headline-md">Haftungsausschluss</h1>

        <div className="flex flex-col gap-xs">
          <h1 className="font-bold text-body-lg">Haftung für Inhalte</h1>
          <p className="text-body-md">
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
            können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter
            sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG
            sind wir als Diensteanbieter jedoch nicht verpflichtet,
            übermittelte oder gespeicherte fremde Informationen zu überwachen
            oder nach Umständen zu forschen, die auf eine rechtswidrige
            Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung
            der Nutzung von Informationen nach den allgemeinen Gesetzen
            bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
            erst ab dem Zeitpunkt der Kenntnis einer konkreten
            Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
            Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>
        </div>

        <div className="flex flex-col gap-xs">
          <h1 className="font-bold text-body-lg">Urheberrecht</h1>
          <p className="text-body-md">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf
            diesen Seiten unterliegen dem deutschen Urheberrecht. Die
            Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
            Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der
            schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            Downloads und Kopien dieser Seite sind nur für den privaten, nicht
            kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser
            Seite nicht vom Betreiber erstellt wurden, werden die
            Urheberrechte Dritter beachtet. Insbesondere werden Inhalte
            Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine
            Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
            entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
            werden wir derartige Inhalte umgehend entfernen.
          </p>
        </div>
      </div>

      <p className="text-body-md text-on-surface-variant">
        Erstellt mit{" "}
        <a
          href="https://impressum-generator.de"
          className="text-primary hover:underline"
        >
          Impressum-Generator.de
        </a>
        , dem Tool für Impressum und{" "}
        <a
          href="https://impressum-generator.de/datenschutz-generator"
          className="text-primary hover:underline"
        >
          Datenschutz-Erklärung
        </a>
        . Nach einer Vorlage der{" "}
        <a
          href="https://www.kanzlei-hasselbach.de/"
          className="text-primary hover:underline"
        >
          Kanzlei Hasselbach
        </a>
        .
      </p>
    </div>
  );
}
