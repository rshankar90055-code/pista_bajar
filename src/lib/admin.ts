export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? "" : "admin123");
}

export function isAdminPasswordValid(password?: string | null) {
  const adminPassword = getAdminPassword();
  return Boolean(adminPassword && password === adminPassword);
}

