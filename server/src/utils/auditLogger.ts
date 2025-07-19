// Audit Loggin to log important actions like object CRUD and Auth
export function logAuditEvent({
  action,
  userId,
  details,
}: {
  action: string;
  userId?: string;
  details?: any;
}) {
  console.log(
    `[AUDIT] ${action} | user=${userId || "N/A"} | details=${
      details ? JSON.stringify(details) : ""
    } | at=${new Date().toISOString()}`
  );
}
