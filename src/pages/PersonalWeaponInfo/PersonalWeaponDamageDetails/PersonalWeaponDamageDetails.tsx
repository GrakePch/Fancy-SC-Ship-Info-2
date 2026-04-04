import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { mdiEyeCircleOutline } from "@mdi/js";
import Icon from "@mdi/react";
import dmgTypeToColor from "../../../assets/damageTypeToColor";
import icons from "../../../assets/icons";
import vehicleStyles from "../../Vehicle/Vehicle.module.css";
import styles from "./PersonalWeaponDamageDetails.module.css";

type DamageKey = "Physical" | "Energy" | "Distortion" | "Stun";

const DAMAGE_TYPES: DamageKey[] = ["Physical", "Energy", "Distortion", "Stun"];
const dmgTypeToIcon: Partial<Record<DamageKey, string>> = {
  Physical: icons.damage_type_physical,
  Energy: icons.damage_type_energy,
  Distortion: icons.damage_type_distortion,
  Stun: mdiEyeCircleOutline,
};

interface PersonalWeaponDamageDetailsProps {
  firingMode: Pick<WeaponFiringMode, "DamagePerShot" | "DamagePerSecond">;
}

function renderDamageRows(
  damage: WeaponDamageSummary | undefined,
  t: (key: string, defaultValue: string) => string,
) {
  return DAMAGE_TYPES.map((type) => {
    const value = damage?.[type] ?? 0;
    const rowStyle = {
      "--damage-color": value ? dmgTypeToColor[type] : "#808080",
    } as CSSProperties;

    return (
      <div
        key={type}
        className={`${vehicleStyles.commonKeyValue} ${styles.damageRow}`}
        style={rowStyle}
      >
        <Icon path={dmgTypeToIcon[type] ?? ""} />
        <div>{t(type, type)}</div>
        <div>{value}</div>
      </div>
    );
  });
}

export default function PersonalWeaponDamageDetails({ firingMode }: PersonalWeaponDamageDetailsProps) {
  const { t: tUi } = useTranslation("ui");
  const tpw = (key: string, defaultValue: string) => tUi(`PersonalWeapon.${key}`, { defaultValue });

  return (
    <div className={styles.container}>
      <p>{tpw("DamagePerShot", "Damage Per Shot")}</p>
      {renderDamageRows(firingMode.DamagePerShot, tpw)}
      <hr />
      <p>{tpw("DamagePerSecond", "Damage Per Second")}</p>
      {renderDamageRows(firingMode.DamagePerSecond, tpw)}
    </div>
  );
}
