import "./SimpleWeaponPublic.css";
import { useEffect, useState } from "react";
import icons from "../../assets/icons";
import SimpleWeapon from "../SimpleWeapon/SimpleWeapon";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";

type SimpleWeaponGroupProps = {
  groupName: string;
  icon: string;
  weaponGroupObj: SpvHardpoints | undefined;
};

const SimpleWeaponGroup = ({ groupName, icon, weaponGroupObj }: SimpleWeaponGroupProps) => {
  const [rootCounting, setRootCounting] = useState<Record<string, number>>({});
  const { t } = useTranslation();

  useEffect(() => {
    const _rootCounting: Record<string, number> = {};
    if (weaponGroupObj?.InstalledItems == undefined) {
      setRootCounting({});
      return;
    }
    weaponGroupObj?.InstalledItems?.forEach((item: SpvPort) => {
      if (item == null) return;

      /* PortName may differ. e.g. wing_left & wing_right */
      const itemNoPortName = JSON.parse(JSON.stringify(item));
      delete itemNoPortName.PortName;
      delete itemNoPortName.Loadout;
      delete itemNoPortName.Flags;
      delete itemNoPortName.BaseLoadout?.ClassName;

      if (!_rootCounting[JSON.stringify(itemNoPortName)]) {
        _rootCounting[JSON.stringify(itemNoPortName)] = Number(itemNoPortName._Quantity) || 1;
      } else {
        _rootCounting[JSON.stringify(itemNoPortName)] += Number(itemNoPortName._Quantity) || 1;
      }
    });

    setRootCounting(_rootCounting);
    // console.log(_rootCounting);
  }, [weaponGroupObj]);

  if (
    !weaponGroupObj ||
    Object.keys(weaponGroupObj).length == 0 ||
    weaponGroupObj?.InstalledItems?.at(0) == null
  )
    return null;

  const isShowLegendDamageType = ["PilotWeapons", "MannedTurrets", "RemoteTurrets"].includes(groupName);

  const isShowLegendEmissionType = ["MissileRacks"].includes(groupName);

  return (
    <div className="SimpleWeaponGroup-container">
      <div className="SimpleWeaponGroup-title">
        <Icon path={icons[icon]} size={"1rem"} />
        <p>{t("SimpleWeaponGroup." + groupName)}</p>
        {isShowLegendDamageType && <LegendDamageType />}
        {isShowLegendEmissionType && <LegendEmissionType />}
      </div>
      {Object.keys(rootCounting).map((item, idx) => {
        const itemObj = JSON.parse(item) as SpvPort;
        return item && <SimpleWeapon item={itemObj} key={item + idx} num={rootCounting[item]} />;
      })}
    </div>
  );
};

const LegendDamageType = () => {
  const { t } = useTranslation();
  return (
    <div className="SimpleWeaponGroup-legend">
      <div style={{ color: "var(--color-physical)" }}>
        <Icon path={icons.damage_type_physical} size="1rem" />
        <p>{t("DamageType.Physical")}</p>
      </div>
      <div style={{ color: "var(--color-energy)" }}>
        <Icon path={icons.damage_type_energy} size="1rem" />
        <p>{t("DamageType.Energy")}</p>
      </div>
      <div style={{ color: "var(--color-distortion)" }}>
        <Icon path={icons.damage_type_distortion} size="1rem" />
        <p>{t("DamageType.Distortion")}</p>
      </div>
    </div>
  );
};

const LegendEmissionType = () => {
  const { t } = useTranslation();
  return (
    <div className="SimpleWeaponGroup-legend">
      <div style={{ color: "var(--color-electromagnetic)" }}>
        <Icon path={icons.emission_type_em} size="1rem" />
        <p>{t("EmissionType.Electromagnetic")}</p>
      </div>
      <div style={{ color: "var(--color-infrared)" }}>
        <Icon path={icons.emission_type_ir} size="1rem" />
        <p>{t("EmissionType.Infrared")}</p>
      </div>
      <div style={{ color: "var(--color-crossSection)" }}>
        <Icon path={icons.emission_type_cs} size="1rem" />
        <p>{t("EmissionType.CrossSection")}</p>
      </div>
    </div>
  );
}

export default SimpleWeaponGroup;
