import React from "react";

export const Card = ({ className = "", ...props }) => (
  <div
    className={`rounded-xl bg-white dark:bg-gray-900 shadow ${className}`}
    {...props}
  />
);

export const CardHeader = ({ className = "", ...props }) => (
  <div className={`p-6 ${className}`} {...props} />
);

export const CardTitle = ({ className = "", ...props }) => (
  <h2 className={`text-xl font-semibold ${className}`} {...props} />
);

export const CardDescription = ({ className = "", ...props }) => (
  <p className={`text-gray-500 dark:text-gray-400 ${className}`} {...props} />
);

export const CardContent = ({ className = "", ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

export const CardFooter = ({ className = "", ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);
