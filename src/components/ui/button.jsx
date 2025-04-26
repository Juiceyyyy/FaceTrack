import React from "react";

const variants = {
  primary: "bg-blue-500 hover:bg-blue-600",
  secondary: "bg-gray-500 hover:bg-gray-600",
  danger: "bg-red-500 hover:bg-red-600",
  success: "bg-green-500 hover:bg-green-600",
};

const sizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
};

const Button = ({ 
  children, 
  className = "", 
  variant = "primary", 
  size = "md", 
  isLoading = false, 
  disabled = false, 
  ...props 
}) => {
  return (
    <button
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        text-white font-medium rounded-md shadow-md 
        transition-transform duration-150 active:scale-95 
        disabled:bg-gray-400 disabled:cursor-not-allowed 
        flex items-center justify-center gap-2 
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
