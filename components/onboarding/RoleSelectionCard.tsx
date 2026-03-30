"use client";

interface RoleSelectionCardProps {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  isSelected?: boolean;
  onClick: () => void;
}

export const RoleSelectionCard = ({
  icon,
  title,
  description,
  benefits,
  isSelected,
  onClick,
}: RoleSelectionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-6 transition ${
        isSelected
          ? "border-brand bg-brand/5 shadow-lg"
          : "border-border hover:border-brand hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
          <ul className="mt-3 space-y-1">
            {benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        {isSelected && (
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand">
            <span className="text-sm font-bold text-white">✓</span>
          </div>
        )}
      </div>
    </button>
  );
};
