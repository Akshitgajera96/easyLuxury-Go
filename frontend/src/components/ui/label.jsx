import * as React from "react";
import clsx from "clsx";

export const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={clsx(
        "text-sm font-medium text-gray-700 dark:text-gray-300",
        className
      )}
      {...props}
    />
  );
});
Label.displayName = "Label";
