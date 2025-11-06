export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        className="h-8 w-8 text-white"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Barco/Vela */}
        <path
          d="M24 8L14 28h20L24 8z"
          fill="currentColor"
        />
        <path
          d="M24 8L34 28H24V8z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M12 28h24l-4 8H16l-4-8z"
          fill="currentColor"
          opacity="0.5"
        />
        <line
          x1="24"
          y1="8"
          x2="24"
          y2="36"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span className="text-xl font-semibold text-white">eng</span>
    </div>
  );
}
