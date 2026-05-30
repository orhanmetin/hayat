import React from "react";
import { cn } from "../../lib/utils";

type AppLogoSize = "sm" | "md" | "lg";

const sizeClasses: Record<AppLogoSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

interface AppLogoProps {
  size?: AppLogoSize;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = "md", className }) => (
  <img
    src="/hayat-icon.png"
    alt="Hayat"
    className={cn("rounded-xl object-cover shrink-0 shadow-sm", sizeClasses[size], className)}
    width={size === "lg" ? 56 : size === "md" ? 40 : 32}
    height={size === "lg" ? 56 : size === "md" ? 40 : 32}
  />
);
