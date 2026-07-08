/**
 * Debug overlay that visualizes the active zone used by useActiveSection.
 * Active zone = 20%–60% of viewport (40% band).
 * Sections in the green zone are highlighted; sections in the red zones are not.
 *
 * Enable by adding ?debug=activeZone to the URL.
 */
export function ActiveZoneOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none" aria-hidden>
      {/* Top inactive zone (0–20% of viewport) */}
      <div
        className="absolute left-0 right-0 border-b-2 border-dashed border-red-500/80 bg-red-500/10"
        style={{ top: 0, height: "20vh" }}
      />
      {/* Active zone (20–60% of viewport) */}
      <div
        className="absolute left-0 right-0 border-y-2 border-dashed border-emerald-500/80 bg-emerald-500/5"
        style={{ top: "20vh", height: "40vh" }}
      />
      {/* Bottom inactive zone (60–100% of viewport) */}
      <div
        className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/80 bg-red-500/10"
        style={{ top: "60vh", height: "40vh" }}
      />
      {/* Center line (viewport center = where "closest to center" is measured) */}
      <div
        className="absolute left-0 right-0 h-px bg-emerald-500/60"
        style={{ top: "50vh" }}
      />
    </div>
  );
}
