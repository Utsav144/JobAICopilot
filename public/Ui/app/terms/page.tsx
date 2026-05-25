import { LegalPage } from "../legal-page";

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" body={["Use JobPilot AI responsibly and review all automated actions before relying on them.", "You remain responsible for information submitted to employers and third-party portals.", "Automation features may pause when a website requires verification, consent, or human judgement."]} />;
}
