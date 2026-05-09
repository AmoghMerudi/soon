export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ color: "var(--foreground)" }}
      >
        Welcome to 0to1
      </h1>
      <p style={{ color: "var(--muted)" }} className="text-base max-w-xl">
        Your autonomous AI company OS. AI agents plan, build, and operate your
        company — from managing tickets to tracking revenue.
      </p>
    </div>
  );
}
