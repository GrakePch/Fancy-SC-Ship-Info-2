import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  mdiCube,
  mdiDatabaseOutline,
  mdiFlare,
  mdiMagazineRifle,
  mdiTarget,
  mdiWeight,
} from "@mdi/js";
import Icon from "@mdi/react";
import listPersonalWeaponRaw from "../../data/fps-weapon-personal-list.json";
import dmgTypeToColor from "../../assets/damageTypeToColor";
import personalWeaponsImg from "../../assets/personal_weapons_side/1080p/personal_weapons_img";
import PortEditable from "./PortEditable/PortEditable";
import vehicleStyles from "../Vehicle/Vehicle.module.css";
import "./PersonalWeaponInfo.css";
import PersonalWeaponCharts from "./PersonalWeaponCharts";
import HumanStatus from "./HumanStatus";
import icons from "../../assets/icons";

const listPersonalWeapon = listPersonalWeaponRaw as unknown as WeaponPersonalList;

const iconPathByFiringMode: Partial<Record<WeaponFiringLocalisedName, string>> = {
  "[AUTO]": icons.pw_fire_type_auto,
  "[SEMI]": icons.pw_fire_type_semi,
  "[BURST]": icons.pw_fire_type_burst,
  "[CHARGE]": icons.pw_fire_type_charge,
  "[SHOTGUN]": icons.pw_fire_type_auto,
  "@LOC_PLACEHOLDER": icons.beam,
};
const INFINITY_SYMBOL = "∞";

export default function PersonalWeaponInfo() {
  const navigate = useNavigate();
  const { className } = useParams();
  const { t: tUi } = useTranslation("ui");
  const { t: tPw } = useTranslation("pw");
  const { t: tItem } = useTranslation("vehicle_item");
  const { t: tManufacturer } = useTranslation("manufacturer");
  const tpw = (key: string, defaultValue: string) =>
    tUi(`PersonalWeapon.${key}`, { defaultValue });

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

  const combatStats = useMemo(() => {
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

  if (!weapon) return null;

  const ammunition = weapon.Ammunition;
  const imageSrc = personalWeaponsImg[weapon.ClassName as keyof typeof personalWeaponsImg] ?? "";

  console.log(weapon);

  return (
    <div className="Personal-Weapon-Info-container">
      <div className="spotlight">
        <h2>{localizedManufacturer || "-"}</h2>
        <h1>{localizedName || weapon.Name}</h1>
        <h3>{weapon.Name}</h3>
        <div className="main-card">
          <div>
            <div className="main-image" style={{ backgroundImage: `url(${imageSrc})` }} />
            <div className="data-basic">
              <div>
                <Icon path={mdiCube} size={1} />
                <p>{tpw("Volume", "Volume")}</p>
                <p>{weapon.Volume} SCU</p>
              </div>
              <div>
                <Icon path={mdiWeight} size={1} />
                <p>{tpw("Mass", "Mass")}</p>
                <p>{weapon.Mass} Kg</p>
              </div>
            </div>
          </div>
          {activeFiringMode && (
            <div className="fire-rate-and-data">
              <div className="important-data-grid">
                <div className="important-data">
                  <p>{tpw("BasicTTK", "Basic TTK")} (s)</p>
                  <p>{combatStats.baseTtk}</p>
                </div>
                <div className="important-data">
                  <p>{tpw("BasicDPS", "Basic DPS")}</p>
                  <p>{combatStats.baseDps}</p>
                </div>
                <div className="important-data">
                  <p>{tpw("FireRate", "Fire Rate")} (RPM)</p>
                  <p>{activeFiringMode.RoundsPerMinute ?? "-"}</p>
                </div>
                <div className="important-data">
                  <p>{tpw("MagSize", "Magazine Size")}</p>
                  <p>{weapon.DefaultMagazineCapacity}</p>
                </div>
              </div>
              <div className="fire-rate-tabs">
                {firingModes.map((mode, idx) => (
                  <button
                    key={`${mode.Name}-${idx}`}
                    className={idx === firingMode ? "active" : ""}
                    onClick={() => setFiringMode(idx)}
                  >
                    <Icon path={iconPathByFiringMode[mode.LocalisedName] ?? mdiDatabaseOutline} size={1} />
                    {tpw(`FiringMode-${mode.Name}`, mode.Name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="attachment-container">
        <PortEditable data={weapon.Ports.Magazine} name="magazine_attach" icon={<Icon path={mdiMagazineRifle} size={1} horizontal/>} />
        <PortEditable data={weapon.Ports.Optics} name="optics_attach" icon={<Icon path={mdiTarget} size={1} />} />
        <PortEditable data={weapon.Ports.Barrel} name="barrel_attach" icon={<Icon path={mdiDatabaseOutline} size={1} rotate={90} />} />
        <PortEditable data={weapon.Ports.UnderBarrel} name="underbarrel_attach" icon={<Icon path={mdiFlare} size={1} />} />
      </div>

      <div className="data-detail">
        <div className="charts">
          <PersonalWeaponCharts ammunition={ammunition} />
          <HumanStatus activeFiringMode={activeFiringMode} />
        </div>
        <div className="main-data">
          {activeFiringMode && (
            <>
              <div className="simple-data">
                <p>{tpw("DamagePerShot", "Damage Per Shot")}</p>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerShot?.Physical ? dmgTypeToColor.Physical : "#808080" }}
                >
                  <div>{tpw("Physical", "Physical")}</div>
                  <div>{activeFiringMode.DamagePerShot?.Physical ?? 0}</div>
                </div>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerShot?.Energy ? dmgTypeToColor.Energy : "#808080" }}
                >
                  <div>{tpw("Energy", "Energy")}</div>
                  <div>{activeFiringMode.DamagePerShot?.Energy ?? 0}</div>
                </div>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerShot?.Distortion ? dmgTypeToColor.Distortion : "#808080" }}
                >
                  <div>{tpw("Distortion", "Distortion")}</div>
                  <div>{activeFiringMode.DamagePerShot?.Distortion ?? 0}</div>
                </div>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerShot?.Stun ? dmgTypeToColor.Stun : "#808080" }}
                >
                  <div>{tpw("Stun", "Stun")}</div>
                  <div>{activeFiringMode.DamagePerShot?.Stun ?? 0}</div>
                </div>
                <hr />
                <p>{tpw("DamagePerSecond", "Damage Per Second")}</p>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerSecond?.Physical ? dmgTypeToColor.Physical : "#808080" }}
                >
                  <div>{tpw("Physical", "Physical")}</div>
                  <div>{activeFiringMode.DamagePerSecond.Physical ?? 0}</div>
                </div>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerSecond?.Energy ? dmgTypeToColor.Energy : "#808080" }}
                >
                  <div>{tpw("Energy", "Energy")}</div>
                  <div>{activeFiringMode.DamagePerSecond.Energy ?? 0}</div>
                </div>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerSecond?.Distortion ? dmgTypeToColor.Distortion : "#808080" }}
                >
                  <div>{tpw("Distortion", "Distortion")}</div>
                  <div>{activeFiringMode.DamagePerSecond.Distortion ?? 0}</div>
                </div>
                <div
                  className={vehicleStyles.commonKeyValue}
                  style={{ color: activeFiringMode.DamagePerSecond?.Stun ? dmgTypeToColor.Stun : "#808080" }}
                >
                  <div>{tpw("Stun", "Stun")}</div>
                  <div>{activeFiringMode.DamagePerSecond.Stun ?? 0}</div>
                </div>
              </div>
              <div className="simple-data">
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("FireRate", "Fire Rate")}</div>
                  <div>{activeFiringMode.RoundsPerMinute ?? "-"} RPM</div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("BulletVelocity", "Bullet Velocity")}</div>
                  <div>{ammunition?.Speed ?? "-"} m/s</div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("BulletRange", "Bullet Range")}</div>
                  <div>{ammunition?.Range ?? "-"} m</div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("BulletLifeTime", "Bullet Lifetime")}</div>
                  <div>{ammunition?.LifeTime ?? "-"} s</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
