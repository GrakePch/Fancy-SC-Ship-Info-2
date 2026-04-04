import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { mdiDatabaseOutline } from "@mdi/js";
import Icon from "@mdi/react";
import icons from "../../../assets/icons";
import styles from "./PersonalWeaponCombatPanel.module.css";

const iconPathByFiringMode: Partial<Record<WeaponFiringLocalisedName, string>> = {
  "[AUTO]": icons.pw_fire_type_auto,
  "[SEMI]": icons.pw_fire_type_semi,
  "[BURST]": icons.pw_fire_type_burst,
  "[CHARGE]": icons.pw_fire_type_charge,
  "[SHOTGUN]": icons.pw_fire_type_auto,
  "@LOC_PLACEHOLDER": icons.beam,
};

interface PersonalWeaponCombatPanelProps {
  firingModes: WeaponFiringMode[];
  activeIndex: number;
  onSelectMode: (index: number) => void;
  defaultMagazineCapacity?: number | string | null;
}

export default function PersonalWeaponCombatPanel({
  firingModes,
  activeIndex,
  onSelectMode,
  defaultMagazineCapacity,
}: PersonalWeaponCombatPanelProps) {
  const INFINITY_SYMBOL = "∞";
  const { t: tUi } = useTranslation("ui");
  const tpw = (key: string, defaultValue: string) => tUi(`PersonalWeapon.${key}`, { defaultValue });
  const activeFiringMode = firingModes[activeIndex];
  const stats = useMemo(() => {
    if (!activeFiringMode) {
      return {
        baseDps: 0,
        baseTtk: INFINITY_SYMBOL,
      };
    }

    const damagePerShot =
      (activeFiringMode.DamagePerShot?.Physical ?? 0) + (activeFiringMode.DamagePerShot?.Energy ?? 0);
    const rpm = Number(activeFiringMode.RoundsPerMinute ?? 0);
    const interval = rpm > 0 ? 60 / rpm : Number.POSITIVE_INFINITY;
    const baseDps = Math.round(
      (activeFiringMode.DamagePerSecond.Physical ?? 0) + (activeFiringMode.DamagePerSecond.Energy ?? 0),
    );
    const baseStk = Math.ceil(100 / Math.max(damagePerShot, 0.0001));
    const baseTtk = baseDps === 0
      ? INFINITY_SYMBOL
      : Number.isFinite(interval)
        ? ((baseStk - 1) * interval).toFixed(2)
        : (100 / baseDps).toFixed(2);

    return {
      baseDps,
      baseTtk,
    };
  }, [activeFiringMode]);

  if (!activeFiringMode) return null;

  return (
    <div className={styles.container}>
      <div className={styles.importantDataGrid}>
        <div className={styles.importantData}>
          <p>{tpw("BasicTTK", "Basic TTK")} (s)</p>
          <p>{stats.baseTtk}</p>
        </div>
        <div className={styles.importantData}>
          <p>{tpw("BasicDPS", "Basic DPS")}</p>
          <p>{stats.baseDps}</p>
        </div>
        <div className={styles.importantData}>
          <p>{tpw("FireRate", "Fire Rate")} (RPM)</p>
          <p>{activeFiringMode.RoundsPerMinute ?? "-"}</p>
        </div>
        <div className={styles.importantData}>
          <p>{tpw("MagSize", "Magazine Size")}</p>
          <p>{defaultMagazineCapacity ?? "-"}</p>
        </div>
      </div>
      <div className={styles.tabs}>
        {firingModes.map((mode, idx) => (
          <button
            key={`${mode.Name}-${idx}`}
            type="button"
            className={idx === activeIndex ? styles.active : ""}
            onClick={() => onSelectMode(idx)}
          >
            <Icon path={iconPathByFiringMode[mode.LocalisedName] ?? mdiDatabaseOutline} size={1} />
            {tpw(`FiringMode-${mode.Name}`, mode.Name)}
          </button>
        ))}
      </div>
    </div>
  );
}
