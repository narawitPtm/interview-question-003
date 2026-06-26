import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function globalSetup() {
  await execAsync(
    `docker exec interview-question-003-postgres-1 psql -U postgres -d it03 -c ` +
    `"UPDATE documents SET status_id = (SELECT id FROM document_statuses WHERE code = 'PENDING'), reason = NULL, decided_at = NULL, updated_at = NOW();"`,
  );
}
