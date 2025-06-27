export const theme = {
  colors: {
    primary: {
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },
    secondary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
    accent: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#F43F5E",
      info: "#38BDF8",
    },
  },
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    0: "0",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    32: "8rem",
    40: "10rem",
    48: "12rem",
    56: "14rem",
    64: "16rem",
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
    none: "none",
  },
  transitions: {
    base: "transition-all duration-200 ease-in-out",
    fast: "transition-all duration-150 ease-in-out",
    slow: "transition-all duration-300 ease-in-out",
  },
  animations: {
    spin: "spin 1s linear infinite",
    pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    bounce: "bounce 1s infinite",
    fadeIn: "fadeIn 0.2s ease-in-out",
    fadeOut: "fadeOut 0.2s ease-in-out",
    slideIn: "slideIn 0.2s ease-in-out",
    slideOut: "slideOut 0.2s ease-in-out",
  },
};

export const buttonStyles = {
  primary: {
    base: "bg-primary-500 text-white",
    hover: "hover:bg-primary-600 hover:shadow-lg transition-all duration-200",
    active: "active:bg-primary-700",
    disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  },
  secondary: {
    base: "bg-secondary-100 text-secondary-700",
    hover: "hover:bg-secondary-200 hover:shadow-md transition-all duration-200",
    active: "active:bg-secondary-300",
    disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  },
  ghost: {
    base: "bg-transparent text-secondary-600",
    hover:
      "hover:bg-secondary-100 hover:text-secondary-900 transition-all duration-200",
    active: "active:bg-secondary-200",
    disabled: "disabled:opacity-50 disabled:cursor-not-allowed",
  },
};

export const cardStyles = {
  base: "bg-white rounded-lg border border-secondary-200",
  hover: "hover:shadow-lg transition-all duration-200",
  header: "border-b border-secondary-200 bg-secondary-50/50",
  content: "p-6",
};

export const inputStyles = {
  base: "w-full rounded-md border border-secondary-200 bg-white px-3 py-2",
  focus:
    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200",
  hover: "hover:border-secondary-300 transition-colors duration-200",
};

export const tableStyles = {
  base: "w-full border border-collapse border-spacing-0",
  header: "bg-secondary-50/50 border-b border-secondary-200",
  row: "border-b border-secondary-100 hover:bg-secondary-50/50 transition-colors duration-200",
  cell: "px-4 py-3 text-sm text-secondary-700",
};

export const badgeStyles = {
  base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  info: "bg-blue-100 text-blue-800",
};

export const dialogStyles = {
  enter: "animate-in fade-in zoom-in-95 duration-200",
  leave: "animate-out fade-out zoom-out-95 duration-200",
  overlay: "bg-black/50 backdrop-blur-sm",
};

export const iconStyles = {
  spin: "hover:animate-spin transition-transform duration-200",
  bounce: "hover:animate-bounce transition-transform duration-200",
  pulse: "hover:animate-pulse transition-transform duration-200",
};
