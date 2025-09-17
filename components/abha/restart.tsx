import { RotateCcw } from "lucide-react";

type RestartProps = {
  onRestart: () => void;
};

export function RestartButton({ onRestart }: RestartProps) {
  return (
    <button
      type="button"
      onClick={onRestart}
      className="absolute top-3 right-3 text-gray-500 hover:text-[#02066b]"
      title="Restart from Step 1"
    >
      <RotateCcw className="w-4 h-4" />
    </button>
  );
}
