// FastAPI returns errors in two shapes:
//   - App-raised HTTPException: { detail: "some string" }
//   - Pydantic validation (422): { detail: [{ msg, loc, type, ... }, ...] }
// This normalizes both into a single displayable string.
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const detail = err.response?.data?.detail;

  if (!detail) return fallback;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(" ");
  }

  return fallback;
}