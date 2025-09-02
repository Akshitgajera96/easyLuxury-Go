import React from "react";
import clsx from "clsx";

export const Button = ({ className, variant = "default", ...props }) => {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variant === "outline"
          ? "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          : "bg-blue-600 text-white hover:bg-blue-700",
        className
      )}
      {...props}
    />
  );
};
