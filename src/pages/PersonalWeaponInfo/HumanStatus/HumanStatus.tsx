import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./HumanStatus.module.css";

export const targetArmors = ["naked", "default", "undersuit", "fa", "light", "medium", "heavy"] as const;

export type TargetArmor = (typeof targetArmors)[number];

type HumanStatusProps = {
  activeFiringMode?: WeaponFiringMode;
};

const selectableArmors: TargetArmor[] = ["naked", "default", "undersuit", "light", "medium", "heavy"];
const INFINITY_SYMBOL = "∞";
const targetArmorsMod: Record<TargetArmor, number[]> = {
  naked: [4, 2, 1.5, 1.5],
  default: [1, 1, 1, 1],
  undersuit: [0.9, 0.9, 0.9, 0.9],
  fa: [0.9, 0.9, 0.9, 0.9],
  light: [0.8, 0.8, 0.8, 0.8],
  medium: [0.7, 0.7, 0.7, 0.7],
  heavy: [0.6, 0.6, 0.6, 0.6],
};
const bodyPartMod = [1.5, 1, 0.8, 0.8];

export default function HumanStatus({ activeFiringMode }: HumanStatusProps) {
  const { t: tUi } = useTranslation("ui");
  const [targetArmor, setTargetArmor] = useState<TargetArmor>("heavy");
  const tpw = (key: string, defaultValue: string) =>
    tUi(`PersonalWeapon.${key}`, { defaultValue });
  const combatStats = useMemo(() => {
    if (!activeFiringMode) {
      return {
        dmgForParts: [0, 0, 0, 0],
        stkForParts: [0, 0, 0, 0],
        ttkForParts: ["0.0", "0.0", "0.0", "0.0"],
      };
    }

    const damagePerShot =
      (activeFiringMode.DamagePerShot?.Physical ?? 0) + (activeFiringMode.DamagePerShot?.Energy ?? 0);
    const damagePerSecond =
      (activeFiringMode.DamagePerSecond?.Physical ?? 0) + (activeFiringMode.DamagePerSecond?.Energy ?? 0);
    const rpm = Number(activeFiringMode.RoundsPerMinute ?? 0);
    const interval = rpm > 0 ? 60 / rpm : Number.POSITIVE_INFINITY;

    const dmgForParts = [0, 0, 0, 0];
    const stkForParts: Array<number | string> = [0, 0, 0, 0];
    const ttkForParts = ["0.0", "0.0", "0.0", "0.0"];

    for (let i = 0; i < 4; i += 1) {
      if (damagePerShot === 0) {
        if (damagePerSecond === 0) {
          stkForParts[i] = INFINITY_SYMBOL;
          ttkForParts[i] = INFINITY_SYMBOL;
        } else {
          const dps = damagePerSecond * bodyPartMod[i] * targetArmorsMod[targetArmor][i];
          stkForParts[i] = INFINITY_SYMBOL;
          ttkForParts[i] = dps > 0 ? (100 / dps).toFixed(1) : INFINITY_SYMBOL;
        }
        continue;
      }
      const dmg = damagePerShot * bodyPartMod[i] * targetArmorsMod[targetArmor][i];
      const stk = Math.ceil(100 / Math.max(dmg, 0.0001));
      const ttk = Number.isFinite(interval) ? ((stk - 1) * interval).toFixed(1) : INFINITY_SYMBOL;
      dmgForParts[i] = Math.round(dmg);
      stkForParts[i] = Number.isFinite(stk) ? stk : 0;
      ttkForParts[i] = ttk;
    }

    return {
      dmgForParts,
      stkForParts,
      ttkForParts,
    };
  }, [activeFiringMode, targetArmor]);

  const getPartStyle = (ttk: string) => {
    const ttkValue = Number(ttk);
    if (!Number.isFinite(ttkValue) || ttkValue < 0) {
      return undefined;
    }

    // Lower TTK -> red (0deg), higher TTK -> cooler hue (up to 240deg).
    const hue = Math.min(240, Math.max(0, (ttkValue / 5) * 240));
    return {
      backgroundColor: `hsla(${hue},50%,50%,.3)`,
    };
  };

  const headStyle = getPartStyle(combatStats.ttkForParts[0]);
  const torsoStyle = getPartStyle(combatStats.ttkForParts[1]);
  const armStyle = getPartStyle(combatStats.ttkForParts[2]);
  const legStyle = getPartStyle(combatStats.ttkForParts[3]);

  return (
    <div className={styles.humanStatus}>
      <div className={styles.humans}>
        <div>
          <p>{tpw("DamagePerShot", "Damage Per Shot")}</p>
          <div className={styles.human}>
            <div className={styles.head} style={headStyle}>{combatStats.dmgForParts[0]}</div>
            <div className={styles.torso} style={torsoStyle}>{combatStats.dmgForParts[1]}</div>
            <div className={styles.arm} style={armStyle}>{combatStats.dmgForParts[2]}</div>
            <div className={styles.arm2} style={armStyle} />
            <div className={styles.leg} style={legStyle}>{combatStats.dmgForParts[3]}</div>
          </div>
        </div>
        <div>
          <p>{tpw("ShotsToKill", "Shots To Kill")}</p>
          <div className={styles.human}>
            <div className={styles.head} style={headStyle}>{combatStats.stkForParts[0]}</div>
            <div className={styles.torso} style={torsoStyle}>{combatStats.stkForParts[1]}</div>
            <div className={styles.arm} style={armStyle}>{combatStats.stkForParts[2]}</div>
            <div className={styles.arm2} style={armStyle} />
            <div className={styles.leg} style={legStyle}>{combatStats.stkForParts[3]}</div>
          </div>
        </div>
        <div>
          <p>{tpw("TimeToKill", "Time To Kill")}</p>
          <div className={styles.human}>
            <div className={styles.head} style={headStyle}>{combatStats.ttkForParts[0]}</div>
            <div className={styles.torso} style={torsoStyle}>{combatStats.ttkForParts[1]}</div>
            <div className={styles.arm} style={armStyle}>{combatStats.ttkForParts[2]}</div>
            <div className={styles.arm2} style={armStyle} />
            <div className={styles.leg} style={legStyle}>{combatStats.ttkForParts[3]}</div>
          </div>
        </div>
      </div>
      <div className={styles.armorSelectors}>
        {selectableArmors.map((armor) => (
          <button
            key={armor}
            className={targetArmor === armor ? styles.active : ""}
            onClick={() => setTargetArmor(armor)}
          >
            {tpw(`Armor-${armor}`, armor)}
          </button>
        ))}
      </div>
    </div>
  );
}
