import { LegalPage } from "../legal-page";

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" body={["JobPilot AI should only collect data required to operate your resume, job tracking, and automation workflows.", "Resume, profile, and application data should be protected with appropriate access controls when connected to a backend.", "Third-party portal integrations may be subject to their own privacy terms."]} />;
}
