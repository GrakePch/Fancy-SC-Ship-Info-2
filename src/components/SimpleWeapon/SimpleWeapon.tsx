import { useEffect, useState } from "react";

import { mdiCircleSmall, mdiLock } from "@mdi/js";
import Icon from "@mdi/react";
import vehicleItemListRaw from "../../data/vehicle-item-list.json";
import icons from "../../assets/icons";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const vehicleItemList = vehicleItemListRaw as unknown as any[];

const dmgTypeToIcon: Record<string, string> = {
  Physical: icons.damage_type_physical,
  Energy: icons.damage_type_energy,
  Distortion: icons.damage_type_distortion,
};

const emissionTypeToIcon: Record<string, string> = {
  Electromagnetic: icons.emission_type_em,
  Infrared: icons.emission_type_ir,
  CrossSection: icons.emission_type_cs,
};

const dmgTypeToCssColor: Record<string, string> = {
  Physical: "var(--color-physical)",
  Energy: "var(--color-energy)",
  Distortion: "var(--color-distortion)",
};

const emissionTypeToCssColor: Record<string, string> = {
  Electromagnetic: "var(--color-electromagnetic)",
  Infrared: "var(--color-infrared)",
  CrossSection: "var(--color-crossSection)",
};

const getItemInfo: any = (className: string) => {
  return vehicleItemList.find((s) => s.className === className);
};

const getZhName = (name: string | undefined, translator: TFunction<"vehicle_item">) => {
  if (!name) return "";

  const variants = new Set<string>();
  const rawName = name;
  const trimmedName = rawName.trim();
  const segments = trimmedName.split(/\s+/).filter(Boolean);

  const addVariant = (variant?: string) => {
    if (variant) {
      variants.add(variant);
    }
  };

  addVariant(rawName);
  addVariant(trimmedName);
  addVariant(trimmedName.toLowerCase()); // handle case mismatches from data

  if (segments.length > 1) {
    const withoutLast = segments.slice(0, -1).join(" ");
    addVariant(withoutLast); // try without suffix like "Laser"
    addVariant(withoutLast.toLowerCase());
  }

  if (segments.length > 2) {
    const withoutLastTwo = segments.slice(0, -2).join(" ");
    addVariant(withoutLastTwo); // try removing more descriptors
    addVariant(withoutLastTwo.toLowerCase());
  }

  for (const variant of variants) {
    const translated = translator(variant, { defaultValue: "" }).trim(); // stops once any variant resolves
    if (!translated) continue;

    const idx = translated.lastIndexOf("(");
    const pure = (idx >= 0 ? translated.slice(0, idx) : translated).trim();
    if (pure) return pure;
  }

  return "";
};

type SimpleWeaponProps = {
  item: SpvPort;
  num?: number;
};

const SimpleWeapon = ({ item, num = 1 }: SimpleWeaponProps) => {
  const { t } = useTranslation();

  const { t: tvi } = useTranslation("vehicle_item");

  const baseLoadout = item.BaseLoadout;

  if (baseLoadout == null) return;

  const translatedName = getZhName(baseLoadout.Name, tvi);

  const itemInfo = getItemInfo(baseLoadout?.ClassName);

  const bulletDmgRaw = itemInfo?.stdItem?.Weapon?.Ammunition?.ImpactDamage;

  const bulletDmgTypesRaw: string[] = bulletDmgRaw ? Object.keys(bulletDmgRaw) : [];

  const bulletDmgType =
    bulletDmgTypesRaw.length > 0
      ? bulletDmgTypesRaw.length == 1
        ? bulletDmgTypesRaw.at(0)
        : "Mixed"
      : "";

  const trackingSignal = itemInfo?.stdItem?.Missile?.TrackingSignal;

  const hasSubItems = item.Ports && item.Ports.length > 0;

  const [rootCounting, setRootCounting] = useState<Record<string, number>>({});
  useEffect(() => {
    const _rootCounting: Record<string, number> = {};
    const subList = item.Ports;

    subList?.forEach((item) => {
      if (item == null) return;

      /* PortName may differ. e.g. wing_left & wing_right */
      const itemNoPortName = JSON.parse(JSON.stringify(item));
      delete itemNoPortName.PortName;

      if (!_rootCounting[JSON.stringify(itemNoPortName)]) {
        _rootCounting[JSON.stringify(itemNoPortName)] = Number(itemNoPortName._Quantity) || 1;
      } else {
        _rootCounting[JSON.stringify(itemNoPortName)] += Number(itemNoPortName._Quantity) || 1;
      }
    });

    setRootCounting(_rootCounting);
    // console.log(_rootCounting);
  }, [item]);

  return (
    <div>
      <div
        className={`SimpleWeapon-container ${hasSubItems && "non-leaf"} ${
          item.Uneditable && "uneditable"
        }`}
      >
        {!hasSubItems && bulletDmgType && (
          <Icon
            path={dmgTypeToIcon[bulletDmgType] || mdiCircleSmall}
            size="1.5rem"
            style={{ color: dmgTypeToCssColor[bulletDmgType] }}
            className="SimpleWeapon-head-icon"
          />
        )}
        {!hasSubItems && trackingSignal && (
          <Icon
            path={emissionTypeToIcon[trackingSignal] || mdiCircleSmall}
            size="1.5rem"
            style={{ color: emissionTypeToCssColor[trackingSignal] }}
            className="SimpleWeapon-head-icon"
          />
        )}
        <div className="SimpleWeapon-names">
          <p className="SimpleWeapon-name">{translatedName || baseLoadout.Name || "未知"}</p>
          {!hasSubItems && <p className="SimpleWeapon-subname">{baseLoadout.Name || "Unknown"}</p>}
        </div>
        <div className="SimpleWeapon-tail-icons">
          {item.Uneditable && <Icon path={mdiLock} style={{ color: "var(--color-text-2)" }} />}

          {hasSubItems ? (
            <div className="SimpleWeapon-size-icon void">{"\u2007\u2007"}</div>
          ) : (
            <div className="SimpleWeapon-size-icon">S{item.MaxSize}</div>
          )}

          <div className="SimpleWeapon-number">{num <= 1 ? "" : "×" + num}</div>
        </div>
      </div>
      <div className="SimpleWeapon-subWeapon-container">
        {Object.keys(rootCounting).map((subItem, idx) => {
          const subItemObj = JSON.parse(subItem) as SpvPort;
          return (
            <SimpleWeapon
              item={subItemObj}
              key={subItemObj.BaseLoadout.Name + idx}
              num={rootCounting[subItem]}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SimpleWeapon;
