

export function maskEmail(email) {
  if (typeof email !== "string") return "";

  const match = email.match(/^([^@]+)@([^@]+)$/);
  if (!match) return email; // fallback si no es email válido

  const [, user, domain] = match;

  const maskPart = (value, visible = 2) => {
    if (value.length <= visible) return "*".repeat(value.length);
    return (
      value.slice(0, visible) +
      "*".repeat(value.length - visible)
    );
  };

  const domainParts = domain.split(".");
  const mainDomain = domainParts.shift();
  const tld = domainParts.join(".");

  return (
    maskPart(user, 2) +
    "@" +
    maskPart(mainDomain, 2) +
    (tld ? "." + tld : "")
  );
}
