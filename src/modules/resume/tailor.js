import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';
import { userProfile } from '../../config/profile.js';

export async function tailorResume(job, ats) {
  const baseResume = await fs.readFile(env.RESUME_SOURCE_PATH, 'utf8');
  const truthfulKeywords = ats.missingKeywords.filter((keyword) =>
    userProfile.primarySkills.map((skill) => skill.toLowerCase()).includes(keyword.toLowerCase())
  );

  const keywordLine =
    truthfulKeywords.length > 0
      ? `\nRole-aligned keywords: ${truthfulKeywords.join(', ')}.\n`
      : '\nRole-aligned keywords: Existing profile already covers the core JD keywords.\n';

  const content = `${baseResume.trim()}\n${keywordLine}`;
  const outputDir = path.resolve('storage/resumes/generated');
  await fs.mkdir(outputDir, { recursive: true });
  const safeCompany = String(job.company).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const filePath = path.join(outputDir, `utsav-dwivedi-${job.id}-${safeCompany}.txt`);
  await fs.writeFile(filePath, content);

  return {
    content,
    filePath,
    tailoredKeywords: truthfulKeywords,
    notes: 'Tailoring is limited to truthful keywords already present in the user profile.'
  };
}
