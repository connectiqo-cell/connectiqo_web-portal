import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Connectiqo",
  description: "The terms that govern your use of Connectiqo.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-secondary">
        {children}
      </div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Terms of Service</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: July 2026</p>
      </div>

      <Section title="1. Acceptance of terms">
        <p>
          By creating an account or using Connectiqo, you agree to these Terms of Service and
          our Privacy Policy. If you do not agree, do not use the service.
        </p>
      </Section>

      <Section title="2. What Connectiqo is">
        <p>
          Connectiqo is a marketplace that connects mentors and learners for live 1-on-1 video
          mentoring sessions. Every account can act as both a mentor and a learner. Connectiqo
          is not a party to the mentoring relationship itself and does not guarantee the
          quality, accuracy, or outcome of any session.
        </p>
      </Section>

      <Section title="3. Accounts">
        <p>
          You must provide accurate information when creating an account and are responsible
          for activity under your account and for keeping your credentials secure. You must be
          legally able to enter into a contract in your jurisdiction to use Connectiqo.
        </p>
      </Section>

      <Section title="4. Bookings &amp; payments">
        <p>
          Session prices are set by mentors. Payments are processed through Razorpay; by
          booking a session you authorize the applicable charge. A platform fee may be applied
          to bookings. Cancellations, rescheduling, and refunds follow the flow presented to
          you at the time of booking.
        </p>
      </Section>

      <Section title="5. Live sessions &amp; recordings">
        <p>
          Live sessions may be recorded for playback by session participants when both parties
          consent. By starting or joining a recorded session, you consent to that recording.
          Do not share recordings outside the platform without the other participant&apos;s
          permission.
        </p>
      </Section>

      <Section title="6. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5">
          <li>Harass, threaten, or abuse another user during chat or a live session</li>
          <li>Upload content you don&apos;t have the rights to, or that is unlawful, or infringing</li>
          <li>Attempt to circumvent Connectiqo&apos;s booking or payment flow to transact off-platform</li>
          <li>Misrepresent your identity, qualifications, or mentor credentials</li>
        </ul>
        <p>
          Report abusive users or content from a profile, chat, or video listing. We may
          suspend or freeze accounts that violate these terms.
        </p>
      </Section>

      <Section title="7. Mentor payouts">
        <p>
          Mentors receive session earnings, less the applicable platform fee, via the payout
          method configured in Settings. Payout timing and KYC requirements are governed by
          our payment processor&apos;s policies.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          You retain ownership of content you upload (e.g. mentor videos, profile photos).
          By uploading, you grant Connectiqo a license to host and display that content as
          part of operating the service.
        </p>
      </Section>

      <Section title="9. Termination &amp; account deletion">
        <p>
          You may delete your account at any time from Settings → Account. We may suspend or
          terminate accounts that violate these terms or applicable law.
        </p>
      </Section>

      <Section title="10. Disclaimers &amp; limitation of liability">
        <p>
          Connectiqo is provided &quot;as is&quot;. We are not responsible for the advice,
          conduct, or content provided by mentors or learners. To the maximum extent permitted
          by law, Connectiqo is not liable for indirect or consequential damages arising from
          your use of the service.
        </p>
      </Section>

      <Section title="11. Changes to these terms">
        <p>
          We may update these terms as the service evolves. Continued use after changes take
          effect constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="12. Contact us">
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:support@connectiqo.app" className="text-accent-link underline">
            support@connectiqo.app
          </a>
          .
        </p>
      </Section>
    </main>
  );
}
