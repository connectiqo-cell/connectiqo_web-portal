import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Connectiqo",
  description: "How Connectiqo collects, uses, and protects your data.",
};

function Section({ title, children }: 
  { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: July 2026</p>
      </div>

      <Section title="Overview">
        <p>
          Connectiqo (&quot;we&quot;, &quot;us&quot;) operates a live 1-on-1 mentorship
          marketplace connecting mentors and learners over video. This policy explains what
          data we collect across our mobile and web apps, why we collect it, and the choices
          you have.
        </p>
      </Section>

      <Section title="Data we collect">
        <ul className="list-disc pl-5">
          <li>
            <strong className="text-text-primary">Account information</strong> — name, email
            address, and profile photo when you sign up or edit your profile.
          </li>
          <li>
            <strong className="text-text-primary">Payment &amp; transaction data</strong> —
            booking amounts, payment status, and transaction references from our payment
            processor (Razorpay). We do not store your card details.
          </li>
          <li>
            <strong className="text-text-primary">Session recordings &amp; video call data</strong>{" "}
            — with your consent, live mentoring sessions may be recorded via our video
            provider (VideoSDK) for playback by session participants.
          </li>
          <li>
            <strong className="text-text-primary">Mentor–learner communications</strong> — chat
            messages sent during a live session.
          </li>
          <li>
            <strong className="text-text-primary">Push notification tokens</strong> — used to
            deliver booking and session reminders to the mobile app.
          </li>
          <li>
            <strong className="text-text-primary">Usage &amp; device data</strong> — basic
            technical information (browser, device type) needed to operate the service
            reliably.
          </li>
        </ul>
      </Section>

      <Section title="How we use your data">
        <p>
          We use your data to operate the marketplace: creating your account, matching and
          booking sessions, processing payments, running live video calls, sending session
          reminders, and providing customer support. We do not sell your personal data.
        </p>
      </Section>

      <Section title="Who we share data with">
        <p>
          We share the minimum data necessary with the vendors that power the service:
          Supabase (database, authentication, file storage), Razorpay (payment processing),
          VideoSDK (live video and recordings), and Firebase (push notifications on mobile).
          Each of these providers processes data under their own privacy and security
          commitments.
        </p>
      </Section>

      <Section title="Data retention &amp; deletion">
        <p>
          We retain your data for as long as your account is active or as needed to provide
          the service, resolve disputes, and meet legal obligations. You can permanently
          delete your account — including your profile, mentor/learner data, and uploaded
          photos — at any time from{" "}
          <a href="/settings/account" className="text-accent-link underline">
            Settings → Account
          </a>
          . Deletion is permanent and cannot be undone.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can access and correct your profile information at any time from Settings. You
          can request a copy of your data or ask us to delete it by contacting us below.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data is encrypted in transit (HTTPS/TLS) and access to production systems is
          restricted. No method of transmission or storage is 100% secure, but we work to
          protect your information using industry-standard practices.
        </p>
      </Section>

      <Section title="Children's privacy">
        <p>
          Connectiqo is not directed at children under 13, and we do not knowingly collect
          data from them.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy as the service evolves. Material changes will be reflected
          by updating the &quot;Last updated&quot; date above.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about this policy or your data? Email{" "}
          <a href="mailto:support@connectiqo.app" className="text-accent-link underline">
            support@connectiqo.app
          </a>
          .
        </p>
      </Section>
    </main>
  );
}
