const LoadingSpinner = ({
  size = "md",
  color = "rose",
  className = "",
  text = "",
  fullScreen = false,
}) => {
  
  const sizeConfig = {
    xs: "h-3 w-3 border",
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-16 w-16 border-4",
    xl: "h-32 w-32 border-4",
  };

  
  const colorConfig = {
    rose: {
      border: "border-rose-200",
      accent: "border-t-rose-600",
    },
    indigo: {
      border: "border-indigo-200",
      accent: "border-t-indigo-600",
    },
    gray: {
      border: "border-gray-200",
      accent: "border-t-gray-600",
    },
    white: {
      border: "border-white/30",
      accent: "border-t-white",
    },
    emerald: {
      border: "border-emerald-200",
      accent: "border-t-emerald-600",
    },
  };

  
  const simpleBorderConfig = {
    rose: "border-b-2 border-rose-600",
    indigo: "border-b-2 border-indigo-600",
    gray: "border-b-2 border-gray-600",
    white: "border-b-2 border-white",
    emerald: "border-b-2 border-emerald-600",
  };

  const spinnerClasses = `
    animate-spin 
    rounded-full 
    ${sizeConfig[size]} 
    ${colorConfig[color].border} 
    ${colorConfig[color].accent}
    ${className}
  `.trim();

  const spinner = <div className={spinnerClasses} />;

  const content = (
    <div className="flex flex-col items-center justify-center">
      {spinner}
      {text && (
        <p
          className={`mt-4 text-gray-600 ${
            size === "xs" || size === "sm" ? "text-sm" : ""
          }`}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};


export const ButtonSpinner = ({ color = "white", className = "" }) => (
  <LoadingSpinner size="xs" color={color} className={className} />
);

export const PageSpinner = ({ text = "Loading...", color = "rose" }) => (
  <LoadingSpinner size="xl" color={color} text={text} fullScreen />
);

export const SectionSpinner = ({ text = "", color = "rose" }) => (
  <LoadingSpinner size="lg" color={color} text={text} />
);

export const InlineSpinner = ({ color = "gray" }) => (
  <LoadingSpinner size="sm" color={color} />
);

export default LoadingSpinner;
