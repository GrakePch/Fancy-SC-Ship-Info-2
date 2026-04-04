import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  mdiDatabaseOutline,
  mdiFlare,
  mdiMagazineRifle,
  mdiTarget,
} from "@mdi/js";
import Icon from "@mdi/react";
import listPersonalWeaponRaw from "../../data/fps-weapon-personal-list.json";
import personalWeaponsImg from "../../assets/personal_weapons_side/1080p/personal_weapons_img";
import PortEditable from "./PortEditable/PortEditable";
import styles from "./PersonalWeaponInfo.module.css";
import PersonalWeaponCharts from "./PersonalWeaponCharts/PersonalWeaponCharts";
import HumanStatus from "./HumanStatus/HumanStatus";
import PersonalWeaponDamageDetails from "./PersonalWeaponDamageDetails/PersonalWeaponDamageDetails";
import PersonalWeaponMiscInfo from "./PersonalWeaponMiscInfo/PersonalWeaponMiscInfo";
import PersonalWeaponCombatPanel from "./PersonalWeaponCombatPanel/PersonalWeaponCombatPanel";

const listPersonalWeapon = listPersonalWeaponRaw as unknown as WeaponPersonalList;

export default function PersonalWeaponInfo() {
  const navigate = useNavigate();
  const { className } = useParams();
  const { t: tPw } = useTranslation("pw");
  const { t: tItem } = useTranslation("vehicle_item");
  const { t: tManufacturer } = useTranslation("manufacturer");

  const weapon = useMemo(() => listPersonalWeapon.find((item) => item.ClassName === className), [className]);

  useEffect(() => {
    if (!weapon) {
      navigate("/PW", { replace: true });
    }
  }, [navigate, weapon]);

  const nameKey = weapon?.NameKey ?? "";
  const localizedName = nameKey
    ? tPw(nameKey, {
        defaultValue: tItem(nameKey, {
          defaultValue: weapon?.Name ?? weapon?.ClassName ?? "",
        }),
      })
    : weapon?.Name ?? weapon?.ClassName ?? "";

  const manufacturerName = weapon?.ManufacturerName ?? "";
  const localizedManufacturer = tManufacturer(manufacturerName, { defaultValue: manufacturerName });

  const firingModes = (weapon?.Firing ?? []) as WeaponFiringMode[];
  const [firingMode, setFiringMode] = useState(0);

  useEffect(() => {
    setFiringMode(0);
  }, [className]);

  const activeFiringMode = firingModes[firingMode];

  if (!weapon) return null;

  const ammunition = weapon.Ammunition;
  const imageSrc = personalWeaponsImg[weapon.ClassName as keyof typeof personalWeaponsImg] ?? "";

  console.log(weapon);

  return (
    <div className={styles.container}>
      <div className={styles.spotlight}>
        <h2>{localizedManufacturer || "-"}</h2>
        <h1>{localizedName || weapon.Name}</h1>
        <h3>{weapon.Name}</h3>
        <div className={styles.mainCard}>
          <div>
            <div className={styles.mainImage} style={{ backgroundImage: `url(${imageSrc})` }} />
          </div>
          {activeFiringMode && (
            <PersonalWeaponCombatPanel
              firingModes={firingModes}
              activeIndex={firingMode}
              onSelectMode={setFiringMode}
              defaultMagazineCapacity={weapon.DefaultMagazineCapacity}
            />
          )}
        </div>
      </div>

      <div className={styles.attachmentContainer}>
        <PortEditable data={weapon.Ports.Magazine} name="magazine_attach" icon={<Icon path={mdiMagazineRifle} size={1} horizontal />} weaponClassName={weapon.ClassName} />
        <PortEditable data={weapon.Ports.Optics} name="optics_attach" icon={<Icon path={mdiTarget} size={1} />} weaponClassName={weapon.ClassName} />
        <PortEditable data={weapon.Ports.Barrel} name="barrel_attach" icon={<Icon path={mdiDatabaseOutline} size={1} rotate={90} />} weaponClassName={weapon.ClassName} />
        <PortEditable data={weapon.Ports.UnderBarrel} name="underbarrel_attach" icon={<Icon path={mdiFlare} size={1} />} weaponClassName={weapon.ClassName} />
      </div>

      <div className={styles.dataDetail}>
        <div className={styles.charts}>
          <PersonalWeaponCharts ammunition={ammunition} />
          <HumanStatus activeFiringMode={activeFiringMode} />
        </div>
        <div className={styles.mainData}>
          {activeFiringMode && (
            <>
              <PersonalWeaponDamageDetails firingMode={activeFiringMode} />
              <PersonalWeaponMiscInfo
                volume={weapon.Volume}
                mass={weapon.Mass}
                ammunition={ammunition}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
