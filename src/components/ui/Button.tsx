import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  fullWidth = false,
  className = "",
  ...props
}) => {
  const width = fullWidth ? "w-full" : "";

  return (
    <button
      className={`py-2 rounded bg-[#A8D500] text-black font-semibold disabled:opacity-50 transition flex items-center justify-center ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
