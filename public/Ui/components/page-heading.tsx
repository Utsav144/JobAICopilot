export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-extrabold tracking-normal">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
    </div>
  );
}
