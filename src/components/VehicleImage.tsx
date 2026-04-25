import type { ImgHTMLAttributes } from "react";
import type { VehicleImageAngle } from "../types/vehicleImage";
import { useVehicleImageSrc, type VehicleImageSize } from "../utils/vehicleImageManifest";

type VehicleImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  angle?: VehicleImageAngle;
  size?: VehicleImageSize;
  vehicleClassName: string | undefined;
};

export default function VehicleImage({
  angle = "top",
  size = "s",
  vehicleClassName,
  ...props
}: VehicleImageProps) {
  const src = useVehicleImageSrc(vehicleClassName, angle, size);

  if (!src) {
    return null;
  }

  return <img {...props} src={src} />;
}
