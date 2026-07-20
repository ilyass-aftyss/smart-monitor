import { useState } from "react";

interface IToggleSwitchProps {
  onChange?: (value: boolean) => void;
  defaultChecked?: boolean;
  label?: string;
}

export default function ToggleSwitch({ onChange, defaultChecked, label }: IToggleSwitchProps) {
  const [isChecked, setIsChecked] = useState<boolean>(defaultChecked ?? false);
  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    onChange?.(newCheckedState);
  };

  return (
    <label className="flex cursor-pointer select-none items-center gap-2">
      <div className="relative">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          className="sr-only"
        />
        <div className={`box block h-8 w-14 rounded-full ${isChecked ? "bg-blue-500/20" : "bg-gray-500/20"}`} />
        <div
          className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
            isChecked
              ? "translate-x-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              : "bg-gray-400"
          }`}
        />
      </div>
      {label && (
        <span className={`text-sm font-medium ${isChecked ? "text-blue-400" : "text-gray-500"}`}>
          {label}
        </span>
      )}
    </label>
  );
}
