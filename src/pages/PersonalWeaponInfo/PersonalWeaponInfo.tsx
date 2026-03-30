import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  mdiCube,
  mdiDatabaseOutline,
  mdiFlare,
  mdiFlash,
  mdiMagazineRifle,
  mdiRayStartArrow,
  mdiTarget,
  mdiWeight,
} from "@mdi/js";
import Icon from "@mdi/react";
import listPersonalWeaponRaw from "../../data/fps-weapon-list.json";
import dmgTypeToColor from "../../assets/damageTypeToColor";
import personalWeaponsImg from "../../assets/personal_weapons_side/1080p/personal_weapons_img";
import PortEditable from "./PortEditable/PortEditable";
import vehicleStyles from "../Vehicle/Vehicle.module.css";
import "./PersonalWeaponInfo.css";
import PersonalWeaponCharts from "./PersonalWeaponCharts";

type DamageMap = {
  Physical?: number;
  Energy?: number;
  Distortion?: number;
  Stun?: number;
};

type DamageDrop = {
  MinDistance: Record<string, number>;
  DropPerMeter: Record<string, number>;
  MinDamage: Record<string, number>;
  DropEnd?: Record<string, number>;
};

type FiringMode = {
  Name: string;
  FireType: string;
  ShotPerAction?: number;
  RoundsPerMinute?: number;
  AmmoPerShot?: number;
  PelletsPerShot?: number;
  DamagePerShot?: DamageMap;
  DamagePerSecond: DamageMap;
  HeatPerShot?: number;
  WearPerShot?: number;
  Spread?: {
    Min: number;
    Max: number;
  };
  AimModifier?: {
    SpreadModifier: {
      Min: number;
      Max: number;
    };
  };
};

type WeaponAmmunition = {
  Speed: number;
  Range: number;
  LifeTime: number;
  ImpactDamage: Record<string, number>;
  DamageDrop: DamageDrop;
};

type StdItem = {
  ClassName: string;
  Name: string;
  Mass: number;
  Volume: number;
  Manufacturer?: {
    Name?: string;
  };
  Weapon?: {
    Firing?: FiringMode[];
    Ammunition?: WeaponAmmunition;
  };
  Ports?: PortData[];
};

type FpsWeapon = {
  className: string;
  name?: string;
  stdItem: StdItem;
};

type PortData = {
  PortName: string;
  MinSize: number;
  MaxSize: number;
  Types: string[];
  InstalledItem?: {
    ClassName: string;
    Magazine?: {
      Capacity?: number;
    };
  };
};

const listPersonalWeapon = listPersonalWeaponRaw as unknown as FpsWeapon[];

const targetArmors = ["naked", "default", "undersuit", "fa", "light", "medium", "heavy"] as const;
const targetArmorsMod: Record<(typeof targetArmors)[number], number[]> = {
  naked: [4, 2, 1.5, 1.5],
  default: [1, 1, 1, 1],
  undersuit: [0.9, 0.9, 0.9, 0.9],
  fa: [0.9, 0.9, 0.9, 0.9],
  light: [0.8, 0.8, 0.8, 0.8],
  medium: [0.7, 0.7, 0.7, 0.7],
  heavy: [0.6, 0.6, 0.6, 0.6],
};
const bodyPartMod = [1.5, 1, 0.8, 0.8];

const iconPathByFiringMode: Record<string, string> = {
  Rapid: mdiFlare,
  Single: mdiRayStartArrow,
  Burst: mdiDatabaseOutline,
  Charge: mdiFlash,
  Shotgun: mdiFlare,
  RapidBeam: mdiRayStartArrow,
  Beam: mdiRayStartArrow,
  TractorBeam: mdiRayStartArrow,
};

export default function PersonalWeaponInfo() {
  const navigate = useNavigate();
  const { className } = useParams();
  const { t: tUi } = useTranslation("ui");
  const { t: tPw } = useTranslation("pw");
  const { t: tItem } = useTranslation("vehicle_item");
  const { t: tManufacturer } = useTranslation("manufacturer");
  const tpw = (key: string, defaultValue: string) =>
    tUi(`PersonalWeapon.${key}`, { defaultValue });

  const source = useMemo(() => listPersonalWeapon.find((item) => item.className === className), [className]);

  useEffect(() => {
    if (!source) {
      navigate("/PW", { replace: true });
    }
  }, [navigate, source]);

  const dataPW = source?.stdItem;
  const nameKey = source?.name?.startsWith("@") ? source.name.slice(1).toLowerCase() : "";
  const localizedName = nameKey
    ? tPw(nameKey, {
        defaultValue: tItem(nameKey, {
          defaultValue: dataPW?.Name ?? source?.className ?? "",
        }),
      })
    : dataPW?.Name ?? source?.className ?? "";

  const manufacturerName = dataPW?.Manufacturer?.Name ?? "";
  const localizedManufacturer = tManufacturer(manufacturerName, { defaultValue: manufacturerName });

  const firingModes = dataPW?.Weapon?.Firing ?? [];
  const [firingMode, setFiringMode] = useState(0);
  const [targetArmor, setTargetArmor] = useState<(typeof targetArmors)[number]>("heavy");

  useEffect(() => {
    setFiringMode(0);
  }, [className]);

  const activeFiringMode = firingModes[firingMode];
  const portsByName = useMemo<Record<string, PortData>>(() => {
    const map: Record<string, PortData> = {};
    for (const port of dataPW?.Ports ?? []) {
      map[port.PortName] = port;
    }
    return map;
  }, [dataPW?.Ports]);

  const combatStats = useMemo(() => {
    if (!activeFiringMode) {
      return {
        baseDps: 0,
        baseTtk: "N/A",
        dmgForParts: [0, 0, 0, 0],
        stkForParts: [0, 0, 0, 0],
        ttkForParts: ["0.00", "0.00", "0.00", "0.00"],
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
    const baseTtk = Number.isFinite(interval) ? ((baseStk - 1) * interval).toFixed(2) : "N/A";

    const dmgForParts = [0, 0, 0, 0];
    const stkForParts = [0, 0, 0, 0];
    const ttkForParts = ["0.00", "0.00", "0.00", "0.00"];

    for (let i = 0; i < 4; i += 1) {
      const dmg = damagePerShot * bodyPartMod[i] * targetArmorsMod[targetArmor][i];
      const stk = Math.ceil(100 / Math.max(dmg, 0.0001));
      const ttk = Number.isFinite(interval) ? ((stk - 1) * interval).toFixed(2) : "N/A";
      dmgForParts[i] = Math.round(dmg * 10) / 10;
      stkForParts[i] = Number.isFinite(stk) ? stk : 0;
      ttkForParts[i] = ttk;
    }

    return {
      baseDps,
      baseTtk,
      dmgForParts,
      stkForParts,
      ttkForParts,
    };
  }, [activeFiringMode, targetArmor]);

  if (!source || !dataPW) return null;

  const ammunition = dataPW.Weapon?.Ammunition;
  const imageSrc = personalWeaponsImg[dataPW.ClassName as keyof typeof personalWeaponsImg] ?? "";
  const magazineSize = portsByName.magazine_attach?.InstalledItem?.Magazine?.Capacity ?? "-";

  return (
    <div className="Personal-Weapon-Info-container">
      <div className="spotlight">
        <h2>{localizedManufacturer || "-"}</h2>
        <h1>{localizedName || dataPW.Name}</h1>
        <h3>{dataPW.Name}</h3>
        <div className="main-card">
          <div>
            <div className="main-image" style={{ backgroundImage: `url(${imageSrc})` }} />
            <div className="data-basic">
              <div>
                <Icon path={mdiCube} size={1} />
                <p>{tpw("Volume", "Volume")}</p>
                <p>{dataPW.Volume} SCU</p>
              </div>
              <div>
                <Icon path={mdiWeight} size={1} />
                <p>{tpw("Mass", "Mass")}</p>
                <p>{dataPW.Mass} Kg</p>
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
                  <p>{magazineSize}</p>
                </div>
              </div>
              <div className="fire-rate-tabs">
                {firingModes.map((mode, idx) => (
                  <button
                    key={`${mode.FireType}-${idx}`}
                    className={idx === firingMode ? "active" : ""}
                    onClick={() => setFiringMode(idx)}
                  >
                    <Icon path={iconPathByFiringMode[mode.Name] ?? mdiDatabaseOutline} size={1} />
                    {mode.Name === "Burst" && mode.ShotPerAction
                      ? tpw(`FiringMode-Burst-${mode.ShotPerAction}`, `Burst (${mode.ShotPerAction})`)
                      : tpw(`FiringMode-${mode.Name}`, mode.Name)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="attachment-container">
        <PortEditable data={portsByName.magazine_attach} name="magazine_attach" icon={<Icon path={mdiMagazineRifle} size={1} />} />
        <PortEditable data={portsByName.optics_attach} name="optics_attach" icon={<Icon path={mdiTarget} size={1} />} />
        <PortEditable data={portsByName.barrel_attach} name="barrel_attach" icon={<Icon path={mdiDatabaseOutline} size={1} rotate={90} />} />
        <PortEditable data={portsByName.underbarrel_attach} name="underbarrel_attach" icon={<Icon path={mdiFlare} size={1} />} />
      </div>

      <div className="data-detail">
        <div className="charts">
          <PersonalWeaponCharts ammunition={ammunition} />
          <div className="human-status">
            <div className="humans">
              <div>
                <p>{tpw("DamagePerShot", "Damage Per Shot")}</p>
                <div className="human">
                  <div className="head">{combatStats.dmgForParts[0]}</div>
                  <div className="torso">{combatStats.dmgForParts[1]}</div>
                  <div className="arm">{combatStats.dmgForParts[2]}</div>
                  <div className="arm2" />
                  <div className="leg">{combatStats.dmgForParts[3]}</div>
                </div>
              </div>
              <div>
                <p>{tpw("ShotsToKill", "Shots To Kill")}</p>
                <div className="human">
                  <div className="head">{combatStats.stkForParts[0]}</div>
                  <div className="torso">{combatStats.stkForParts[1]}</div>
                  <div className="arm">{combatStats.stkForParts[2]}</div>
                  <div className="arm2" />
                  <div className="leg">{combatStats.stkForParts[3]}</div>
                </div>
              </div>
              <div>
                <p>{tpw("TimeToKill", "Time To Kill")}</p>
                <div className="human">
                  <div className="head">{combatStats.ttkForParts[0]}</div>
                  <div className="torso">{combatStats.ttkForParts[1]}</div>
                  <div className="arm">{combatStats.ttkForParts[2]}</div>
                  <div className="arm2" />
                  <div className="leg">{combatStats.ttkForParts[3]}</div>
                </div>
              </div>
            </div>
            <div className="armor-selectors">
              {[0, 1, 2, 4, 5, 6].map((idx) => (
                <button
                  key={targetArmors[idx]}
                  className={targetArmor === targetArmors[idx] ? "active" : ""}
                  onClick={() => setTargetArmor(targetArmors[idx])}
                >
                  {tpw(`Armor-${targetArmors[idx]}`, targetArmors[idx])}
                </button>
              ))}
            </div>
          </div>
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
                  <div>{tpw("AmmoPerShot", "Ammo Per Shot")}</div>
                  <div>{activeFiringMode.AmmoPerShot ?? "-"}</div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("PelletsPerShot", "Pellets Per Shot")}</div>
                  <div>{activeFiringMode.PelletsPerShot ?? "-"}</div>
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
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("Spread-Min", "Spread Min")}</div>
                  <div>{activeFiringMode.Spread?.Min ?? "-"}</div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("Spread-Max", "Spread Max")}</div>
                  <div>{activeFiringMode.Spread?.Max ?? "-"}</div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("Spread-Aim-Min", "Spread Aim Min")}</div>
                  <div>
                    {activeFiringMode.Spread?.Min != null && activeFiringMode.AimModifier?.SpreadModifier?.Min != null
                      ? (activeFiringMode.Spread.Min * activeFiringMode.AimModifier.SpreadModifier.Min).toFixed(0)
                      : "-"}
                  </div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("Spread-Aim-Max", "Spread Aim Max")}</div>
                  <div>
                    {activeFiringMode.Spread?.Max != null && activeFiringMode.AimModifier?.SpreadModifier?.Max != null
                      ? (activeFiringMode.Spread.Max * activeFiringMode.AimModifier.SpreadModifier.Max).toFixed(0)
                      : "-"}
                  </div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("HeatPerShot", "Heat Per Shot")}</div>
                  <div>{activeFiringMode.HeatPerShot ?? "-"}</div>
                </div>
                <div className={vehicleStyles.commonKeyValue}>
                  <div>{tpw("WearPerShot", "Wear Per Shot")}</div>
                  <div>{activeFiringMode.WearPerShot ?? "-"}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
