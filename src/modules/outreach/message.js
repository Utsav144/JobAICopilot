import { userProfile } from '../../config/profile.js';

export function generateRecruiterMessage(job, recruiterName = 'Recruiter') {
  return userProfile.recruiterMessageTemplate
    .replace('[Recruiter Name]', recruiterName)
    .replace(
      'Senior .NET / AWS opportunities',
      `${job.title || 'Senior .NET / AWS'} opportunities`
    );
}
