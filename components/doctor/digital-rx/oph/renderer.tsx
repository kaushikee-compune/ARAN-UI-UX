import OphPreview from "./preview";
import type { OphCanonical } from "./canonical";

export function renderOphRecord(canonical: OphCanonical) {
  return <OphPreview payload={canonical} />;
}
