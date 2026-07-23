import type { Metadata } from "next";

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
        Last updated: 07/07/2026
      </p>

      <p className="text-body-md">
        Welcome to DiplomaHub, a community platform for IB Diploma Programme
        students, alumni, and contributors (&quot;Platform,&quot;
        &quot;we,&quot; &quot;us&quot;). By creating an account or using the
        Platform, you agree to these Terms of Service (&quot;Terms&quot;).
        If you do not agree, please do not use the Platform.
      </p>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">1. Eligibility</h2>
        <p className="text-body-md">
          You must be at least 13 years old to use DiplomaHub. If you are
          under the age of majority in your jurisdiction, you represent that
          you have permission from a parent or guardian to use the Platform
          where required by local law.
        </p>
        <p className="text-body-md">
          DiplomaHub is an independent, student-run community platform.{" "}
          <span className="font-bold">
            We are not affiliated with, endorsed by, or officially connected
            to the International Baccalaureate Organization (IBO).
          </span>{" "}
          &quot;IB,&quot; &quot;International Baccalaureate,&quot; and
          &quot;Diploma Programme&quot; are used descriptively to refer to
          the educational program our users are enrolled in or have
          completed.
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
            You agree to provide accurate information when creating your
            account (e.g., IB year, school), and to keep it up to date.
          </li>
          <li>
            We may suspend or terminate accounts that violate these Terms,
            provide false information, or engage in behavior that harms the
            community.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">3. User-Generated Content</h2>
        <p className="text-body-md">
          DiplomaHub allows users to submit articles, resources, discussion
          posts, comments, and other content (&quot;User Content&quot;).
        </p>
        <p className="text-body-md">
          <span className="font-bold">Ownership:</span> You retain ownership
          of the User Content you submit.
        </p>
        <p className="text-body-md">
          <span className="font-bold">License to us:</span> By submitting
          User Content, you grant DiplomaHub a non-exclusive, worldwide,
          royalty-free license to host, store, display, reproduce, and
          distribute that content on the Platform for the purpose of
          operating and promoting DiplomaHub. This license ends when you
          delete the content or your account, except where content has
          already been shared, downloaded, or incorporated into discussions
          by other users.
        </p>
        <p className="text-body-md font-bold">
          Your responsibilities: You agree that content you submit:
        </p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>Is yours to share, or you have the right to share it</li>
          <li>
            Does not include official IB past exam papers, copyrighted
            textbook excerpts, or other material you don&apos;t have rights
            to distribute
          </li>
          <li>
            Does not contain harassment, hate speech, plagiarized academic
            work presented as original, or content that violates academic
            integrity policies
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
          <li>A description of the copyrighted work or material you believe is being infringed</li>
          <li>The specific URL or location of the content on the Platform</li>
          <li>Your contact information</li>
          <li>A statement that you have a good-faith belief the use is not authorized</li>
          <li>
            A statement, made in good faith and under penalty of perjury or
            equivalent, that the information provided is accurate and that
            you are the rights holder or authorized to act on their behalf
          </li>
        </ol>
        <p className="text-body-md">
          Upon receiving a valid notice, we will act promptly to review and,
          where appropriate, remove or disable access to the reported
          content. Users who repeatedly submit infringing content may have
          their accounts suspended or terminated.
        </p>
        <p className="text-body-md">
          If you believe your content was removed in error, you may contact
          us to request a review.
        </p>
        <p className="text-body-md">
          This process is intended to align with notice-and-takedown
          obligations under EU law, including the e-Commerce Directive and
          the Digital Services Act (DSA), as applicable to hosting providers
          based in the EU.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">5. Academic Integrity</h2>
        <p className="text-body-md">
          DiplomaHub is a resource and discussion platform, not a substitute
          for your own academic work. Content shared on the Platform (notes,
          guides, discussion) is intended to support learning, not to be
          submitted as your own work in violation of your school&apos;s or
          the IBO&apos;s academic honesty policies. Users found using the
          Platform to facilitate plagiarism or exam misconduct may have
          their accounts suspended.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">6. Community Conduct</h2>
        <p className="text-body-md">Users agree not to:</p>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>Harass, bully, or discriminate against other users</li>
          <li>Impersonate other individuals or organizations</li>
          <li>Post spam, malware, or unauthorized commercial content</li>
          <li>Attempt to circumvent security features or access other users&apos; accounts</li>
          <li>Misrepresent an official affiliation with the IBO, a school, or DiplomaHub itself</li>
        </ul>
        <p className="text-body-md">
          We reserve the right to moderate, remove content, and suspend or
          terminate accounts that violate these Terms at our discretion.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          7. Reputation &amp; Trust Features
        </h2>
        <p className="text-body-md">
          DiplomaHub may display badges, contribution scores, or trust
          indicators based on user activity. These are intended to reflect
          community participation and are not a certification of academic
          ability or affiliation with the IBO.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">8. Disclaimers</h2>
        <ul className="list-disc pl-lg flex flex-col gap-xs text-body-md">
          <li>The Platform and its content are provided &quot;as is,&quot; without warranties of any kind.</li>
          <li>
            DiplomaHub is a community-driven platform; we do not guarantee
            the accuracy, completeness, or reliability of user-submitted
            resources or advice.
          </li>
          <li>
            We are not responsible for academic outcomes, exam results, or
            decisions made based on content found on the Platform.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">9. Limitation of Liability</h2>
        <p className="text-body-md">
          To the fullest extent permitted by law, DiplomaHub and its
          founders/contributors are not liable for any indirect, incidental,
          or consequential damages arising from your use of the Platform.
          Nothing in these Terms limits liability for intentional
          misconduct or gross negligence, or any other liability that
          cannot be excluded under German law (e.g., under §§ 276, 309
          BGB).
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          10. Changes to the Platform or Terms
        </h2>
        <p className="text-body-md">
          We may update these Terms or modify/discontinue features of the
          Platform at any time. We will post updated Terms on this page with
          a new &quot;Last updated&quot; date. Continued use after changes
          take effect constitutes acceptance.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">
          11. Governing Law and Jurisdiction
        </h2>
        <p className="text-body-md">
          These Terms are governed by the laws of the{" "}
          <span className="font-bold">Federal Republic of Germany</span>,
          excluding the UN Convention on Contracts for the International
          Sale of Goods (CISG). Where you are a consumer, mandatory
          consumer-protection provisions of your country of residence
          (including any applicable EU consumer law) remain unaffected and
          continue to apply alongside these Terms.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">12. Contact</h2>
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
        <h2 className="font-bold text-headline-md">13. Severability</h2>
        <p className="text-body-md">
          If any provision of these Terms is found invalid or unenforceable,
          the remaining provisions will remain in full force and effect,
          and the invalid provision will be replaced with a valid one that
          most closely reflects its original intent.
        </p>
      </section>

      <section className="flex flex-col gap-sm">
        <h2 className="font-bold text-headline-md">14. Operator Information</h2>
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
