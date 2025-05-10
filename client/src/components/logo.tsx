import blueEarthLogo from "@/assets/BlueEarth-Capital_blue.png";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <img src={blueEarthLogo} alt="BlueEarth Capital" className={className} />
  );
}