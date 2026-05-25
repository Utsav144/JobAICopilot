import { query, pool } from '../src/db/pool.js';
import { userProfile } from '../src/config/profile.js';

try {
  await query(
    `INSERT INTO user_profiles (
      name, "current_role", current_company, experience_years, location_preference,
      work_preference, expected_salary_min_lpa, expected_salary_max_lpa,
      primary_skills, target_roles
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      userProfile.name,
      userProfile.currentRole,
      userProfile.currentCompany,
      userProfile.experienceYears,
      userProfile.locationPreference,
      userProfile.workPreference,
      userProfile.expectedSalaryLpa.min,
      userProfile.expectedSalaryLpa.max,
      userProfile.primarySkills,
      userProfile.targetRoles
    ]
  );
  console.log('Seeded user profile');
} finally {
  await pool.end();
}
