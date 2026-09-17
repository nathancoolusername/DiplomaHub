import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/legal/terms-of-service" },
};

export default function TermsOfService() {
  return (
    <div className="flex flex-col gap-lg max-w-[800px] mx-auto px-margin py-[60px]">
      <h1 className="font-serif text-headline-lg font-bold">
        DiplomaHub Terms of Service
      </h1>
      <p className="text-on-surface-variant text-body-lg">
        Last updated: 17/09/2026
      </p>

      <p className="text-body-md">
        Welcome to DiplomaHub, a platform for IB Diploma Programme students,
        alumni, and contributors that offers study resources, articles, and a
        personal planner called the Hub (&quot;Platform,&quot; &quot;we,&quot;
        &quot;us&quot;). By creating an account or using the Platform, you agree
        to these Terms of Service (&quot;Terms&quot;). If you do not agree,
        please do not use the Platform.
      </p>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">1. Eligibility</h2>
        <p className="text-body-md">
          You must be at least 13 years old to use DiplomaHub. If you are under
          the age of majority in your jurisdiction, you represent that you have
          permission from a parent or guardian to use the Platform where
          required by local law.
        </p>
        <p className="text-body-md">
          DiplomaHub is an independent, student-run platform.{" "}
          <span className="font-bold">
            We are not affiliated with, endorsed by, or officially connected to
            the International Baccalaureate Organization (IBO).
          </span>{" "}
          &quot;IB,&quot; &quot;International Baccalaureate,&quot; and
          &quot;Diploma Programme&quot; are used descriptively to refer to the
          educational program our users are enrolled in or have completed.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">2. Your Account</h2>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            You are responsible for maintaining the confidentiality of your
            login credentials and for all activity under your account.
          </li>
          <li>
            You agree to provide accurate information when creating your account
            (e.g., IB year, school), and to keep it up to date.
          </li>
          <li>
            You may stop using the Platform and delete your account at any time.
            Deleting your account also deletes your Hub data, as described in
            our Privacy Policy.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms,
            provide false information, or engage in behavior that harms other
            users or the Platform.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          3. User-Generated Content
        </h2>
        <p className="text-body-md">
          DiplomaHub allows users to submit articles, resources, comments, and
          other content (&quot;User Content&quot;). Discussion posts submitted
          before the discussion feature was retired are also User Content.
        </p>
        <p className="text-body-md">
          <span className="font-bold">Ownership:</span> You retain ownership of
          the User Content you submit.
        </p>
        <p className="text-body-md">
          <span className="font-bold">License to us:</span> By submitting User
          Content, you grant DiplomaHub a non-exclusive, worldwide, royalty-free
          license to host, store, display, reproduce, and distribute that
          content on the Platform for the purpose of operating and promoting
          DiplomaHub. This license ends when you delete the content or your
          account, except where content has already been shared, downloaded, or
          referenced by other users.
        </p>
        <p className="text-body-md">
          <span className="font-bold">Private Hub data:</span> Items, notes, and
          calendar events you add to the Hub are private and are not published
          or used to promote DiplomaHub. We only store and process them to
          provide the Hub to you.
        </p>
        <p className="text-body-md font-bold">
          Your responsibilities: You agree that content you submit:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>Is yours to share, or you have the right to share it</li>
          <li>
            Does not include official IB past exam papers, copyrighted textbook
            excerpts, or other material you don&apos;t have rights to distribute
          </li>
          <li>
            Does not contain harassment, hate speech, plagiarized academic work
            presented as original, or content that violates academic integrity
            policies
          </li>
          <li>Complies with applicable law</li>
        </ul>
        <p className="text-body-md">
          We reserve the right to remove content that violates these Terms,
          including in response to a valid copyright or takedown notice (see
          Section 4, &quot;Notice and Takedown&quot;).
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">4. Notice and Takedown</h2>
        <p className="text-body-md">
          DiplomaHub acts as a host for User Content and does not actively
          monitor all submissions for copyright infringement before they are
          published. If you believe content on the Platform infringes your
          copyright or other rights, you may notify us by contacting{" "}
          <a
            href="mailto:info@diplomahub.org"
            className="text-primary hover:underline"
          >
            info@diplomahub.org
          </a>{" "}
          with:
        </p>
        <ol className="list-decimal pl-lg flex flex-col gap-xs text-body-md">
          <li>
            A description of the copyrighted work or material you believe is
            being infringed
          </li>
          <li>The specific URL or location of the content on the Platform</li>
          <li>Your contact information</li>
          <li>
            A statement that you have a good-faith belief the use is not
            authorized
          </li>
          <li>
            A statement, made in good faith and under penalty of perjury or
            equivalent, that the information provided is accurate and that you
            are the rights holder or authorized to act on their behalf
          </li>
        </ol>
        <p className="text-body-md">
          Upon receiving a valid notice, we will act promptly to review and,
          where appropriate, remove or disable access to the reported content.
          Users who repeatedly submit infringing content may have their accounts
          suspended or terminated.
        </p>
        <p className="text-body-md">
          If you believe your content was removed in error, you may contact us
          to request a review.
        </p>
        <p className="text-body-md">
          This process is intended to align with notice-and-takedown obligations
          under EU law, including the e-Commerce Directive and the Digital
          Services Act (DSA), as applicable to hosting providers based in the
          EU.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          5. The Hub and Planning Features
        </h2>
        <p className="text-body-md">
          The Hub is a personal planning tool that helps you organize deadlines,
          study time, and resources. By using it, you understand and agree that:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            <span className="font-bold">
              You are responsible for your own deadlines.
            </span>{" "}
            Always confirm official dates and requirements with your school,
            teachers, IB coordinator, and universities. Any suggested items,
            stages, dates, or reminders in the Hub are general guidance and are
            not your school&apos;s or the IBO&apos;s official deadlines.
          </li>
          <li>
            Recommended resources shown beside your tasks are suggestions and
            may not match your school&apos;s specific requirements.
          </li>
          <li>
            Calendar sync, notifications, and reminders may be delayed,
            incomplete, or temporarily unavailable. Calendar apps such as Google
            Calendar refresh subscribed calendars on their own schedule, which
            can take several hours. Do not rely on them as your only record of
            important deadlines.
          </li>
          <li>
            You should only import calendar files that you have the right to
            use.
          </li>
          <li>
            Your private calendar link lets anyone who has it view the items it
            includes. You are responsible for keeping it confidential and can
            generate a new link at any time to disable the old one.
          </li>
          <li>
            Study time and progress figures are for your personal tracking only.
          </li>
          <li>
            We recommend keeping your own record of important deadlines, as Hub
            features may change or be temporarily unavailable.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">6. Academic Integrity</h2>
        <p className="text-body-md">
          DiplomaHub is a resource and planning platform, not a substitute for
          your own academic work. Content shared on the Platform (notes, guides,
          exemplars, articles) is intended to support learning, not to be
          submitted as your own work in violation of your school&apos;s or the
          IBO&apos;s academic honesty policies. Exemplars show what strong work
          can look like; do not copy their research questions, data, structure,
          or wording into your own submissions. Users found using the Platform
          to facilitate plagiarism or exam misconduct may have their accounts
          suspended.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">7. Acceptable Use</h2>
        <p className="text-body-md">Users agree not to:</p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>Harass, bully, or discriminate against other users</li>
          <li>Impersonate other individuals or organizations</li>
          <li>Post spam, malware, or unauthorized commercial content</li>
          <li>
            Upload malicious or deliberately malformed files, including through
            calendar import
          </li>
          <li>
            Attempt to circumvent security features or access other users&apos;
            accounts, data, or calendar links
          </li>
          <li>
            Scrape or bulk-download resources, or send automated requests that
            overload or interfere with the Platform
          </li>
          <li>
            Misrepresent an official affiliation with the IBO, a school, or
            DiplomaHub itself
          </li>
        </ul>
        <p className="text-body-md">
          We reserve the right to moderate, remove content, and suspend or
          terminate accounts that violate these Terms at our discretion.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          8. Reputation &amp; Trust Features
        </h2>
        <p className="text-body-md">
          DiplomaHub may display badges, points, contribution scores, or trust
          indicators based on user activity. These are intended to reflect
          contributions to the Platform and are not a certification of academic
          ability or affiliation with the IBO.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">9. Privacy</h2>
        <p className="text-body-md">
          Our{" "}
          <Link
            href="/legal/privacy-policy"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </Link>{" "}
          explains what information we collect, including Hub planner data,
          imported calendar events, and private calendar links, and how we use
          and protect it.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">10. Disclaimers</h2>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>
            The Platform and its content are provided &quot;as is,&quot; without
            warranties of any kind.
          </li>
          <li>
            Much of the content on DiplomaHub is contributed by users; we do not
            guarantee the accuracy, completeness, or reliability of
            user-submitted resources or advice.
          </li>
          <li>
            We do not guarantee that the Hub, calendar sync, reminders, or
            imports will be accurate, uninterrupted, or error-free.
          </li>
          <li>
            Subject to Section 11, we are not responsible for academic outcomes,
            exam results, missed deadlines, or decisions made based on content
            or information found on the Platform.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          11. Limitation of Liability
        </h2>
        <p className="text-body-md">
          To the fullest extent permitted by law, DiplomaHub and its
          founders/contributors are not liable for any indirect, incidental, or
          consequential damages arising from your use of the Platform. Nothing
          in these Terms limits liability for intentional misconduct or gross
          negligence, for injury to life, body, or health, or any other
          liability that cannot be excluded under German law (e.g., under §§
          276, 309 BGB).
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          12. Changes to the Platform or Terms
        </h2>
        <p className="text-body-md">
          We may update these Terms or modify or discontinue features of the
          Platform. We will post updated Terms on this page with a new
          &quot;Last updated&quot; date, and for significant changes we will
          also notify you by email or through a notice on the Platform before
          they take effect. If you do not agree with the updated Terms, you may
          stop using the Platform and delete your account.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          13. Governing Law and Jurisdiction
        </h2>
        <p className="text-body-md">
          These Terms are governed by the laws of the{" "}
          <span className="font-bold">Federal Republic of Germany</span>,
          excluding the UN Convention on Contracts for the International Sale of
          Goods (CISG). Where you are a consumer, mandatory consumer-protection
          provisions of your country of residence (including any applicable EU
          consumer law) remain unaffected and continue to apply alongside these
          Terms.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">14. Contact</h2>
        <p className="text-body-md">
          Questions about these Terms can be directed to:{" "}
          <a
            href="mailto:info@diplomahub.org"
            className="text-primary hover:underline"
          >
            info@diplomahub.org
          </a>
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">15. Severability</h2>
        <p className="text-body-md">
          If any provision of these Terms is found invalid or unenforceable, the
          remaining provisions will remain in full force and effect, and the
          applicable statutory provisions will apply in place of the invalid
          provision.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">16. Operator Information</h2>
        <p className="text-body-md">DiplomaHub is operated by:</p>
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
