import { useEffect, useState } from "react";

import { mdiCircleSmall, mdiLock } from "@mdi/js";
import Icon from "@mdi/react";
import vehicleItemListRaw from "../../data/vehicle-item-list.json";
import icons from "../../assets/icons";
import { useTranslation } from "react-i18next";

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

type SimpleWeaponProps = {
  item: SpvPort;
  num?: number;
};

type SimpleWeaponGroupEntry = {
  item: SpvPort;
  count: number;
};

const SimpleWeapon = ({ item, num = 1 }: SimpleWeaponProps) => {
  const { t: tvi } = useTranslation("vehicle_item");

  const baseLoadout = item.BaseLoadout;

  if (baseLoadout == null) return;

  const itemInfo = getItemInfo(baseLoadout?.ClassName);
  const translatedName = tvi(baseLoadout.ClassName, { defaultValue: baseLoadout.Name || "未知" });

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

  const [rootCounting, setRootCounting] = useState<Record<string, SimpleWeaponGroupEntry>>({});
  useEffect(() => {
    const _rootCounting: Record<string, SimpleWeaponGroupEntry> = {};
    const subList = item.Ports;

    subList?.forEach((item) => {
      if (item == null) return;

      /* PortName may differ. e.g. wing_left & wing_right */
      const itemNoPortName = JSON.parse(JSON.stringify(item));
      delete itemNoPortName.PortName;
      delete itemNoPortName.Loadout;
      delete itemNoPortName.Flags;
      delete itemNoPortName.BaseLoadout?.ClassName;

      const groupKey = JSON.stringify(itemNoPortName);
      if (!_rootCounting[groupKey]) {
        _rootCounting[groupKey] = {
          item,
          count: Number(item._Quantity) || 1,
        };
      } else {
        _rootCounting[groupKey].count += Number(item._Quantity) || 1;
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
        {Object.entries(rootCounting).map(([groupKey, entry], idx) => {
          return (
            <SimpleWeapon
              item={entry.item}
              key={groupKey + idx}
              num={entry.count}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SimpleWeapon;
