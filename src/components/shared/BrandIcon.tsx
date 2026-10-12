export function BrandIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}passage-icon.webp`}
      alt="Passage"
      width={44}
      height={44}
      className={`rounded-xl ${className}`}
    />
  );
}
