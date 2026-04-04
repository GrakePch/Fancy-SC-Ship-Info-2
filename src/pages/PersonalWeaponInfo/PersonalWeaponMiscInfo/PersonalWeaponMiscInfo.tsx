import { useTranslation } from "react-i18next";
import vehicleStyles from "../../Vehicle/Vehicle.module.css";
import styles from "./PersonalWeaponMiscInfo.module.css";
import { mdiArrowExpandHorizontal, mdiChevronTripleRight, mdiCube, mdiWeight } from "@mdi/js";
import Icon from "@mdi/react";

interface PersonalWeaponMiscInfoProps {
  volume?: number | string | null;
  mass?: number | string | null;
  ammunition?: Pick<WeaponAmmunition, "Speed" | "Range">;
}

export default function PersonalWeaponMiscInfo({ volume, mass, ammunition }: PersonalWeaponMiscInfoProps) {
  const { t: tUi } = useTranslation("ui");
  const tpw = (key: string, defaultValue: string) => tUi(`PersonalWeapon.${key}`, { defaultValue });

  return (
    <div className={styles.container}>
      <div className={vehicleStyles.commonKeyValue}>
        <Icon path={mdiCube} />
        <div>{tpw("Volume", "Volume")}</div>
        <div>{volume ?? "-"} SCU</div>
      </div>
      <div className={vehicleStyles.commonKeyValue}>
        <Icon path={mdiWeight} />
        <div>{tpw("Mass", "Mass")}</div>
        <div>{mass ?? "-"} Kg</div>
      </div>
      <div className={vehicleStyles.commonKeyValue}>
        <Icon path={mdiChevronTripleRight} />
        <div>{tpw("BulletVelocity", "Bullet Velocity")}</div>
        <div>{ammunition?.Speed ?? "-"} m/s</div>
      </div>
      <div className={vehicleStyles.commonKeyValue}>
        <Icon path={mdiArrowExpandHorizontal} />
        <div>{tpw("BulletRange", "Bullet Range")}</div>
        <div>{ammunition?.Range ?? "-"} m</div>
      </div>
    </div>
  );
}
