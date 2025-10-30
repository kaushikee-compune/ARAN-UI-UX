import Image from "next/image";

type PillVariant = "gray" | "blue" | "green" | "red";

const VARIANT: Record<PillVariant, string> = {
  gray: "border-gray-300 hover:bg-gray-50",
  blue: "border-blue-300 hover:bg-blue-50",
  green: "border-green-300 hover:bg-green-50",
  red: "border-red-300 hover:bg-red-50",
};

export function RoundPill({
  img,
  label,
  onClick,
  variant = "gray",
}: {
  img: string;
  label: string;
  onClick?: () => void;
  variant?: PillVariant;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      type="button"
      className={[
        "group relative grid place-items-center overflow-visible",
        "w-9 h-9 rounded-xl border-1 bg-white shadow-sm transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        VARIANT[variant],
      ].join(" ")}
    >
      <Image
        src={img}
        alt={label}
        width={18}
        height={18}
        className="pointer-events-none"
      />
      <span
        className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[11px] text-black font-medium 
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-20"
      >
        {label}
      </span>
    </button>
  );
}
