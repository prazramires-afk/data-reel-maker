import { Link } from "react-router-dom";

interface Props {
  size?: number;
  showText?: boolean;
  asLink?: boolean;
  className?: string;
}

export const BrandLogo = ({ size = 28, showText = true, asLink = true, className = "" }: Props) => {
  const content = (
    <span className={`flex items-center gap-2 ${className}`}>
      <img
        src="/icons/icon-192.png"
        width={size}
        height={size}
        alt="Data to Video logo"
        className="rounded-md shrink-0"
        style={{ width: size, height: size }}
      />
      {showText && (
        <span className="font-bold text-foreground tracking-tight whitespace-nowrap">
          Data to Video
        </span>
      )}
    </span>
  );
  return asLink ? <Link to="/" aria-label="Data to Video — home">{content}</Link> : content;
};