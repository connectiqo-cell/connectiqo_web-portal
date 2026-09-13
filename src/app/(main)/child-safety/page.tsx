import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Child Safety Standards — Connectiqo",
  description:
    "Connectiqo's published standards against child sexual abuse and exploitation (CSAE), including CSAM reporting and enforcement.",
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

/**
 * Public CSAE / child-safety standards page for Google Play Console
 * (Social category Child Safety Standards declaration).
 * Live URL: https://app.connectiqo.com/child-safety
 */
export default function ChildSafetyStandardsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Child Safety Standards</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: September 2026</p>
        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
          These published standards apply to <strong className="text-text-primary">Connectiqo</strong>{" "}
          (the Connectiqo mobile app on Google Play and Apple App Store, and related web
          experiences at connectiqo.com / app.connectiqo.com). Connectiqo is a mentorship
          platform for live mentor–learner video sessions and educational video content.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          Connectiqo has a <strong className="text-text-primary">zero-tolerance</strong> policy
          toward child sexual abuse and exploitation (CSAE) and child sexual abuse material
          (CSAM).
        </p>
      </div>

      <Section title="1. Zero tolerance for CSAE and CSAM">
        <p>
          Connectiqo strictly prohibits any content, conduct, or activity that involves or
          promotes the sexual abuse, sexual exploitation, or endangerment of minors (anyone
          under 18), including but not limited to:
        </p>
        <ul className="list-disc pl-5">
          <li>Creating, uploading, sharing, requesting, or circulating CSAM</li>
          <li>Grooming, solicitation, or sexualization of minors</li>
          <li>
            Any attempt to use Connectiqo to facilitate CSAE online, offline, or on other
            platforms
          </li>
        </ul>
        <p>
          Accounts found to engage in such activity will be suspended or permanently removed.
          Related content will be removed when we become aware of it.
        </p>
      </Section>

      <Section title="2. Age and intended audience">
        <p>
          Connectiqo is intended for users who can lawfully use the service in their
          jurisdiction. The mobile app is rated for ages 13 and older. We do not knowingly
          allow child sexual exploitation content on the platform, and we take action against
          users who attempt to involve minors in prohibited activity.
        </p>
      </Section>

      <Section title="3. In-app reporting">
        <p>
          Users can report safety concerns, abusive users, and prohibited content from within
          the Connectiqo app and website — including report controls on profiles, videos,
          bookings, and live calls. Reports are reviewed by our team so we can investigate and
          take appropriate action, including content removal and account enforcement.
        </p>
      </Section>

      <Section title="4. How we respond to CSAM">
        <p>
          When we obtain actual knowledge of CSAM or CSAE-related activity on Connectiqo, we:
        </p>
        <ul className="list-disc pl-5">
          <li>Remove or restrict access to the material as quickly as practicable</li>
          <li>Suspend or permanently ban the responsible account(s)</li>
          <li>
            Preserve relevant records as required for investigation and lawful reporting
          </li>
          <li>
            Report confirmed CSAM to the appropriate regional or national authority (including
            mechanisms such as NCMEC where applicable) in accordance with applicable law
          </li>
        </ul>
      </Section>

      <Section title="5. Compliance with child safety laws">
        <p>
          Connectiqo complies with applicable child safety laws and regulations in the markets
          where we operate, including obligations to address CSAM and to cooperate with lawful
          requests from authorities. We maintain internal processes so designated staff can
          review reports and escalate serious cases.
        </p>
      </Section>

      <Section title="6. Child safety point of contact">
        <p>
          For notifications related to CSAE or CSAM on Connectiqo, including notices from
          Google Play or other platforms, contact:
        </p>
        <p>
          <strong className="text-text-primary">Email:</strong>{" "}
          <a
            href="mailto:connectiqosocial@gmail.com"
            className="font-semibold text-accent-link underline-offset-2 hover:underline"
          >
            connectiqosocial@gmail.com
          </a>
        </p>
        <p>
          This contact can discuss Connectiqo&apos;s child-safety enforcement practices and
          take action when required.
        </p>
      </Section>

      <Section title="7. Related policies">
        <p>
          These standards work together with our{" "}
          <a
            href="https://connectiqo.com/terms"
            className="font-semibold text-accent-link underline-offset-2 hover:underline"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://connectiqo.com/privacy"
            className="font-semibold text-accent-link underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
          . Using Connectiqo means you agree not to engage in CSAE/CSAM or any conduct that
          endangers children.
        </p>
        <p>
          Direct link to this page (for Google Play and other platforms):{" "}
          <Link
            href="/child-safety"
            className="font-semibold text-accent-link underline-offset-2 hover:underline"
          >
            https://app.connectiqo.com/child-safety
          </Link>
        </p>
      </Section>
    </main>
  );
}
