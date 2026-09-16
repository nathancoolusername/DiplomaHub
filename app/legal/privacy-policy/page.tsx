import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/legal/privacy-policy" },
};

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col gap-lg max-w-[800px] mx-auto px-margin py-[60px]">
      <h1 className="font-serif text-headline-lg font-bold">
        DiplomaHub Privacy Policy
      </h1>
      <p className="text-on-surface-variant text-body-lg">
        Last updated: 16/09/2026
      </p>

      <p className="text-body-md">
        DiplomaHub (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) operates
        diplomahub.org (the &quot;Platform&quot;), a platform for IB Diploma
        Programme students, alumni, and contributors that offers study
        resources, articles, and a personal planner called the Hub. This Privacy
        Policy explains what information we collect, how we use it, and the
        choices you have.
      </p>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">1. Who This Applies To</h2>
        <p className="text-body-md">
          DiplomaHub is intended for users 13 years of age or older. If you are
          under the age of majority in your jurisdiction, you confirm that you
          have permission from a parent or guardian to use the Platform, where
          required by local law.
        </p>
        <p className="text-body-md">
          We do not knowingly collect personal information from children under
          13. If we learn that we have collected such information, we will
          delete it promptly.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          2. Information We Collect
        </h2>
        <p className="text-body-md font-bold">
          Information you provide directly:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            Account information (name, email address, password — handled via
            Supabase Auth). If you sign in with Google, we receive your name,
            email address, and profile picture from Google.
          </li>
          <li>Profile information (IB year/grade, bio, if provided)</li>
          <li>
            Content you submit (articles, resources, comments, and discussion
            posts submitted before the discussion feature was retired)
          </li>
          <li>
            Hub planner data: the subjects and levels you select, and the items
            you add, including their titles, dates and times, subject, type,
            stages, completion status, and notes
          </li>
          <li>Study sessions you record with the Hub focus timer</li>
          <li>
            Calendar events you choose to import from a calendar file (see
            Section 5)
          </li>
          <li>Communications with us (support requests, feedback)</li>
        </ul>
        <p className="text-body-md font-bold">
          Information collected automatically:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            Basic usage data (pages visited, actions taken, timestamps) for the
            purpose of improving the Platform
          </li>
          <li>
            Standard technical data (IP address, browser type, device type)
            collected by our hosting provider (Vercel) and database provider
            (Supabase)
          </li>
          <li>
            If you create a private calendar link, the time it was most recently
            accessed by a calendar app
          </li>
        </ul>
        <p className="text-body-md font-bold">Cookies and browser storage:</p>
        <p className="text-body-md">
          We use essential cookies to keep you signed in and to secure the
          sign-in process. We may also use your browser&apos;s local storage to
          remember interface preferences on your device. These are necessary for
          the Platform to work, and we do not use advertising cookies.
        </p>
        <p className="text-body-md">
          We do not use third-party advertising trackers or sell user data to
          advertisers.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          3. How We Use Information
        </h2>
        <p className="text-body-md">We use collected information to:</p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>Create and manage your account</li>
          <li>Display your public profile and contributions to other users</li>
          <li>
            Operate reputation/trust features (e.g., contribution history,
            badges)
          </li>
          <li>
            Provide the Hub, including your calendar, today&apos;s focus,
            progress tracking, and resources related to your tasks
          </li>
          <li>
            Process calendar files you choose to import and generate your
            private calendar link when you create one
          </li>
          <li>
            Send account emails, such as sign-up confirmation and password reset
            messages
          </li>
          <li>Improve and maintain the Platform</li>
          <li>Communicate with you about your account or platform updates</li>
          <li>Enforce our Terms of Service and keep the community safe</li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          4. How Information Is Shared
        </h2>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            <span className="font-bold">Other users:</span> Your profile,
            articles, comments, and published resources are visible to other
            users of the Platform (and, for public pages, to visitors without an
            account), depending on your privacy settings. Your Hub planner data
            is private and is not visible to other users.
          </li>
          <li>
            <span className="font-bold">Service providers:</span> We use
            Supabase (database, authentication, storage), Vercel (hosting),
            Resend (email delivery), and Google (sign-in with Google and email
            correspondence through Google Workspace) to operate the Platform.
            These providers process data on our behalf under their own security
            and privacy commitments.
          </li>
          <li>
            <span className="font-bold">Calendar apps you connect:</span> If you
            add your private calendar link to Google Calendar, Apple Calendar,
            Outlook, or another calendar app, that app&apos;s provider retrieves
            the information included in your calendar feed (see Section 5) and
            handles it under its own privacy policy. This only happens if you
            choose to add the link.
          </li>
          <li>
            <span className="font-bold">Legal requirements:</span> We may
            disclose information if required by law, or to protect the rights,
            safety, or property of DiplomaHub, our users, or others.
          </li>
          <li>We do not sell your personal information to third parties.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          5. The Hub and Calendar Features
        </h2>
        <p className="text-body-md font-bold">Planner data</p>
        <p className="text-body-md">
          Items, subjects, notes, and study sessions in the Hub are private to
          your account. Access controls ensure that only you can view or change
          them.
        </p>
        <p className="text-body-md font-bold">Importing calendar files</p>
        <p className="text-body-md">
          When you upload a calendar file (.ics), we read it on our servers to
          show you a preview. Only the events you select and confirm are saved.
          For those events, we store the title, date and time, and the
          event&apos;s identifier from the file, which we use to avoid creating
          duplicates if you import the same file again. We do not store event
          descriptions, locations, or attendee information, and the uploaded
          file itself is not kept after it has been processed. You can undo an
          import from the Hub.
        </p>
        <p className="text-body-md font-bold">Private calendar link</p>
        <p className="text-body-md">
          If you create a calendar link, we generate a unique secret link that
          lets calendar apps display your Hub items. We store only a hashed
          version of the link&apos;s secret, so we cannot recover the link
          itself. The feed includes item titles, subjects, dates, times, and
          completion status. It never includes your notes.
        </p>
        <p className="text-body-md">
          Anyone who has your link can see the information in your feed, so do
          not share it. You can generate a new link at any time, which
          immediately stops the old link from working. Calendar apps may
          continue to show events they have already downloaded until they
          refresh or you remove the calendar from the app.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">6. Data Retention</h2>
        <p className="text-body-md">
          We retain account and content data for as long as your account is
          active. Hub planner items are kept until you delete them or delete
          your account. Deleting your account also deletes your planner items,
          imported events, study sessions, and calendar link.
        </p>
        <p className="text-body-md">
          You may request deletion of your account and associated personal data
          at any time by contacting us (see Section 12). Deleted data may remain
          in backups maintained by our service providers for a limited period
          before it is overwritten. Some content (e.g., discussion replies) may
          be retained in anonymized form to preserve conversation context.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">7. Security</h2>
        <p className="text-body-md">
          We protect your information using encrypted connections (HTTPS),
          database access controls that restrict each user to their own private
          data, and authentication handled by Supabase Auth, which does not
          store passwords in plain text. Calendar link secrets are stored only
          in hashed form. No method of transmission or storage is completely
          secure, so if you believe your account has been compromised, please
          contact us.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          8. Legal Basis for Processing (GDPR)
        </h2>
        <p className="text-body-md">
          DiplomaHub is operated from Germany, and personal data is processed in
          accordance with the EU General Data Protection Regulation (GDPR). We
          process your data on the following legal bases:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            <span className="font-bold">Contract</span> (Art. 6(1)(b) GDPR): to
            create your account and provide the Platform&apos;s core features,
            including the Hub, calendar imports, and your private calendar link
          </li>
          <li>
            <span className="font-bold">Legitimate interests</span> (Art.
            6(1)(f) GDPR): to maintain security, prevent abuse, and improve the
            Platform
          </li>
          <li>
            <span className="font-bold">Consent</span> (Art. 6(1)(a) GDPR):
            where you opt into optional features (e.g., a newsletter), which you
            may withdraw at any time
          </li>
          <li>
            <span className="font-bold">Legal obligation</span> (Art. 6(1)(c)
            GDPR): where processing is required to comply with applicable law
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          9. International Users &amp; Data Transfers
        </h2>
        <p className="text-body-md">
          DiplomaHub is used by IB students and alumni globally. By using the
          Platform, you understand that your information may be processed and
          stored in a country other than your own, including outside the EEA,
          depending on where our service providers (e.g., Supabase, Vercel,
          Resend, Google) operate their infrastructure. Where personal data is
          transferred outside the EEA, we rely on appropriate safeguards
          recognized under GDPR, such as Standard Contractual Clauses, to
          protect your data.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">10. Your Rights (GDPR)</h2>
        <p className="text-body-md">
          If you are located in the EEA, UK, or another jurisdiction with
          similar data protection laws, you have the right to:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            <span className="font-bold">Access</span> the personal data we hold
            about you
          </li>
          <li>
            <span className="font-bold">Rectify</span> inaccurate or incomplete
            data
          </li>
          <li>
            <span className="font-bold">Erase</span> your data (&quot;right to
            be forgotten&quot;), subject to certain exceptions
          </li>
          <li>
            <span className="font-bold">Restrict</span> or{" "}
            <span className="font-bold">object to</span> certain processing
          </li>
          <li>
            <span className="font-bold">Data portability</span> — receive your
            data in a structured, machine-readable format
          </li>
          <li>
            <span className="font-bold">Withdraw consent</span> at any time,
            where processing is based on consent
          </li>
          <li>
            <span className="font-bold">Lodge a complaint</span> with your local
            data protection authority (in Germany, the relevant
            Landesdatenschutzbehörde for your state, or the Bundesbeauftragte
            für den Datenschutz und die Informationsfreiheit (BfDI))
          </li>
        </ul>
        <p className="text-body-md">
          To exercise any of these rights, contact us using the details in
          Section 12.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">11. Your Choices</h2>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            You can access and update most profile information directly in your
            account settings.
          </li>
          <li>
            You can edit or delete your Hub items at any time, and undo calendar
            imports from the Hub.
          </li>
          <li>
            You can generate a new private calendar link at any time, which
            disables the old one, and remove the calendar from any calendar app
            you added it to.
          </li>
          <li>
            You can request a copy of your data, correction, or account deletion
            by contacting us.
          </li>
          <li>
            You can control what information appears on your public profile.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">12. Contact Us</h2>
        <p className="text-body-md">
          Questions about this Privacy Policy or your data, or requests to
          exercise your rights under Section 10, can be directed to:{" "}
          <a
            href="mailto:info@diplomahub.org"
            className="text-primary hover:underline"
          >
            info@diplomahub.org
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          13. Changes to This Policy
        </h2>
        <p className="text-body-md">
          We may update this Privacy Policy from time to time. We will post the
          updated version on this page with a new &quot;Last updated&quot; date.
          If we make significant changes, we will also let you know by email or
          through a notice on the Platform.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">14. Data Controller</h2>
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
