import { useTranslation } from "react-i18next";
import dmgTypeToColor from "../../assets/damageTypeToColor";
import personalWeaponsImg from "../../assets/personal_weapons_side/144p/personal_weapons_img";
import styles from "./PersonalWeaponSelectorItem.module.css";

const DEFAULT_VALUE_BAR_COLOR = "var(--color-text-2)";
const BAR_DAMAGE_TYPES = Object.keys(dmgTypeToColor) as Array<keyof typeof dmgTypeToColor>;

type PersonalWeaponSelectorItemProps = {
  item: WeaponPersonal;
  onClick: () => void;
};

function getDominantDamageColor(item: WeaponPersonal) {
  const totals = BAR_DAMAGE_TYPES.reduce<Record<string, number>>((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {});

  for (const firingMode of item.Firing) {
    for (const type of BAR_DAMAGE_TYPES) {
      totals[type] += firingMode.DamagePerSecond[type as FiringDamageType] ?? 0;
    }
  }

  let dominantType: keyof typeof dmgTypeToColor | null = null;
  let dominantValue = 0;

  for (const type of BAR_DAMAGE_TYPES) {
    const value = totals[type];
    if (value > dominantValue) {
      dominantValue = value;
      dominantType = type;
    }
  }

  return dominantType ? dmgTypeToColor[dominantType] : DEFAULT_VALUE_BAR_COLOR;
}

function resolveDisplayName(item: WeaponPersonal, tPw: (k: string, opts?: { defaultValue?: string }) => string, tItem: (k: string, opts?: { defaultValue?: string }) => string) {
  if (item.NameKey) {
    const fallbackVehicleItem = tItem(item.NameKey, { defaultValue: "" });
    return tPw(item.NameKey, {
      defaultValue: fallbackVehicleItem || item.Name || item.ClassName,
    });
  }
  const byClassName = tItem(`item_name${item.ClassName}`.toLowerCase(), { defaultValue: "" });
  return byClassName || item.Name || item.ClassName;
}

export default function PersonalWeaponSelectorItem({ item, onClick }: PersonalWeaponSelectorItemProps) {
  const { t: tUi } = useTranslation("ui");
  const { t: tPw } = useTranslation("pw");
  const { t: tItem } = useTranslation("vehicle_item");

  const thumbnail = personalWeaponsImg[item.ClassName as keyof typeof personalWeaponsImg] ?? "";
  const dominantDamageColor = getDominantDamageColor(item);
  const displayName = resolveDisplayName(item, tPw, tItem);
  const maxDpsLabel = tUi("PersonalWeapon.FPSSort-MaxDPS", { defaultValue: "Max DPS" });

  return (
    <div className={styles.item} onClick={onClick}>
      <div className={styles.contents}>
        <p className={styles.name}>{displayName}</p>
        <p className={styles.nameSmall}>{item.Name}</p>
        <p className={styles.value}>
          <span style={{ color: dominantDamageColor }}>{Math.round(item.MaxDps)}</span> {maxDpsLabel}
        </p>
      </div>
      <div className={styles.thumbnail} style={{ backgroundImage: `url(${thumbnail})` }} />
      <div
        className={styles.valueBar}
        style={{
          width: `${(item.MaxDps / 500) * 100}%`,
          backgroundColor: dominantDamageColor,
        }}
      />
    </div>
  );
}
