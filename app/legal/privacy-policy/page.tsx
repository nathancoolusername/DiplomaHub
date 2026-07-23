import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col gap-lg max-w-[800px] mx-auto px-margin py-[60px]">
      <h1 className="font-serif text-headline-lg font-bold">
        DiplomaHub Privacy Policy
      </h1>
      <h1 className="text-on-surface-variant text-body-lg">
        Last updated: 07/07/2026
      </h1>

      <p className="text-body-md">
        DiplomaHub (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;)
        operates diplomahub.org (the &quot;Platform&quot;), a community
        platform for IB Diploma Programme students, alumni, and
        contributors. This Privacy Policy explains what information we
        collect, how we use it, and the choices you have.
      </p>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">1. Who This Applies To</h1>
        <p className="text-body-md">
          DiplomaHub is intended for users 13 years of age or older. If you
          are under the age of majority in your jurisdiction, you confirm
          that you have permission from a parent or guardian to use the
          Platform, where required by local law.
        </p>
        <p className="text-body-md">
          We do not knowingly collect personal information from children
          under 13. If we learn that we have collected such information, we
          will delete it promptly.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">
          2. Information We Collect
        </h1>
        <p className="text-body-md font-bold">Information you provide directly:</p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>Account information (name, email address, password — handled via Supabase Auth)</li>
          <li>Profile information (IB year/grade, bio, if provided)</li>
          <li>Content you submit (discussion posts, articles, resources, comments)</li>
          <li>Communications with us (support requests, feedback)</li>
        </ul>
        <p className="text-body-md font-bold">Information collected automatically:</p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            Basic usage data (pages visited, actions taken, timestamps) for
            the purpose of improving the Platform
          </li>
          <li>
            Standard technical data (IP address, browser type, device type)
            collected by our hosting provider (Vercel) and database provider
            (Supabase)
          </li>
        </ul>
        <p className="text-body-md">
          We do not use third-party advertising trackers or sell user data
          to advertisers.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">3. How We Use Information</h1>
        <p className="text-body-md">We use collected information to:</p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>Create and manage your account</li>
          <li>Display your public profile, posts, and contributions to other users</li>
          <li>Operate reputation/trust features (e.g., contribution history, badges)</li>
          <li>Improve and maintain the Platform</li>
          <li>Communicate with you about your account or platform updates</li>
          <li>Enforce our Terms of Service and keep the community safe</li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">
          4. How Information Is Shared
        </h1>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            <span className="font-bold">Other users:</span> Your profile,
            posts, discussions, and published resources are visible to other
            users of the Platform (and, for public pages, to visitors
            without an account), depending on your privacy settings.
          </li>
          <li>
            <span className="font-bold">Service providers:</span> We use
            Supabase (database, authentication, storage) and Vercel
            (hosting) to operate the Platform. These providers process data
            on our behalf under their own security and privacy commitments.
          </li>
          <li>
            <span className="font-bold">Legal requirements:</span> We may
            disclose information if required by law, or to protect the
            rights, safety, or property of DiplomaHub, our users, or others.
          </li>
          <li>We do not sell your personal information to third parties.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">5. Data Retention</h1>
        <p className="text-body-md">
          We retain account and content data for as long as your account is
          active. You may request deletion of your account and associated
          personal data at any time by contacting us (see Section 10). Some
          content (e.g., discussion replies) may be retained in anonymized
          form to preserve conversation context.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">
          6. Legal Basis for Processing (GDPR)
        </h1>
        <p className="text-body-md">
          DiplomaHub is operated from Germany, and personal data is
          processed in accordance with the EU General Data Protection
          Regulation (GDPR). We process your data on the following legal
          bases:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            <span className="font-bold">Contract</span> (Art. 6(1)(b) GDPR):
            to create your account and provide the Platform&apos;s core
            features
          </li>
          <li>
            <span className="font-bold">Legitimate interests</span> (Art.
            6(1)(f) GDPR): to maintain security, prevent abuse, and improve
            the Platform
          </li>
          <li>
            <span className="font-bold">Consent</span> (Art. 6(1)(a) GDPR):
            where you opt into optional features (e.g., a newsletter), which
            you may withdraw at any time
          </li>
          <li>
            <span className="font-bold">Legal obligation</span> (Art.
            6(1)(c) GDPR): where processing is required to comply with
            applicable law
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">
          7. International Users &amp; Data Transfers
        </h1>
        <p className="text-body-md">
          DiplomaHub is used by IB students and alumni globally. By using
          the Platform, you understand that your information may be
          processed and stored in a country other than your own, including
          outside the EEA, depending on where our service providers (e.g.,
          Supabase, Vercel) operate their infrastructure. Where personal
          data is transferred outside the EEA, we rely on appropriate
          safeguards recognized under GDPR, such as Standard Contractual
          Clauses, to protect your data.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">8. Your Rights (GDPR)</h1>
        <p className="text-body-md">
          If you are located in the EEA, UK, or another jurisdiction with
          similar data protection laws, you have the right to:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            <span className="font-bold">Access</span> the personal data we
            hold about you
          </li>
          <li>
            <span className="font-bold">Rectify</span> inaccurate or
            incomplete data
          </li>
          <li>
            <span className="font-bold">Erase</span> your data (&quot;right
            to be forgotten&quot;), subject to certain exceptions
          </li>
          <li>
            <span className="font-bold">Restrict</span> or{" "}
            <span className="font-bold">object to</span> certain processing
          </li>
          <li>
            <span className="font-bold">Data portability</span> — receive
            your data in a structured, machine-readable format
          </li>
          <li>
            <span className="font-bold">Withdraw consent</span> at any time,
            where processing is based on consent
          </li>
          <li>
            <span className="font-bold">Lodge a complaint</span> with your
            local data protection authority (in Germany, the relevant
            Landesdatenschutzbehörde for your state, or the Bundesbeauftragte
            für den Datenschutz und die Informationsfreiheit (BfDI))
          </li>
        </ul>
        <p className="text-body-md">
          To exercise any of these rights, contact us using the details in
          Section 10.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">9. Your Choices</h1>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            You can access and update most profile information directly in
            your account settings.
          </li>
          <li>
            You can request a copy of your data, correction, or account
            deletion by contacting us.
          </li>
          <li>You can control what information appears on your public profile.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">10. Contact Us</h1>
        <p className="text-body-md">
          Questions about this Privacy Policy or your data, or requests to
          exercise your rights under Section 8, can be directed to:{" "}
          <a
            href="mailto:info@diplomahub.org"
            className="text-primary hover:underline"
          >
            info@diplomahub.org
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">
          11. Changes to This Policy
        </h1>
        <p className="text-body-md">
          We may update this Privacy Policy from time to time. We will post
          the updated version on this page with a new &quot;Last
          updated&quot; date. Continued use of the Platform after changes
          take effect constitutes acceptance of the revised Policy.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h1 className="font-bold text-headline-md">12. Data Controller</h1>
        <p className="text-body-md">
          The data controller responsible for your personal data under this
          Privacy Policy is:
        </p>
        <p className="text-body-md font-bold">
          ANDY NATHAN PIEUME TCHIYEP —{" "}
          <a
            href="mailto:info@diplomahub.org"
            className="text-primary hover:underline"
          >
            info@diplomahub.org
          </a>
        </p>
      </section>
    </div>
  );
}
