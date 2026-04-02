import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import { mdiSortAscending, mdiSortDescending } from "@mdi/js";
import weaponListRaw from "../../data/fps-weapon-list.json";
import personalWeaponsImg from "../../assets/personal_weapons_side/144p/personal_weapons_img";
import "./PersonalWeaponSelector.css";

type EnrichedWeapon = SpvPersonalWeapon & {
  sort: {
    maxDPS: number;
  };
};

const weaponList = weaponListRaw as unknown as SpvPersonalWeapon[];

const gunTypes = ["HG", "SMG", "AR", "SR", "SG", "LMG", "GL", "Heavy"] as const;
type GunType = (typeof gunTypes)[number] | "Other";

function getMaxDps(item: SpvPersonalWeapon): number {
  const firingModes = item.stdItem.Weapon?.Firing ?? [];
  if (firingModes.length === 0) return 0;

  return Math.max(
    ...firingModes.map((mode) => {
      const dps = mode.DamagePerSecond;
      return (dps?.Physical ?? 0) + (dps?.Energy ?? 0);
    }),
  );
}

function classifyGun(item: SpvPersonalWeapon): GunType {
  if (item.subType === "Small") return "HG";
  if (item.subType === "Large") return "Heavy";
  if (item.subType !== "Medium") return "Other";
  const tags = item.tags ?? "";
  if (tags.includes("sniper")) return "SR";
  if (tags.includes("rifle")) return "AR";
  if (tags.includes("shotgun")) return "SG";
  if (tags.includes("smg")) return "SMG";
  if (tags.includes("lmg")) return "LMG";
  if (tags.includes("glauncher")) return "GL";
  return "Other";
}

export default function PersonalWeaponSelector() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t: tUi } = useTranslation("ui");
  const { t: tPw } = useTranslation("pw");
  const { t: tItem } = useTranslation("vehicle_item");
  const tpw = (key: string, defaultValue: string) =>
    tUi(`PersonalWeapon.${key}`, { defaultValue });

  const sortMode = useMemo(() => {
    const mode = searchParams.get("sort");
    if (mode === "maxDPS-") return { by: "dps" as const, order: -1 as const };
    if (mode === "maxDPS") return { by: "dps" as const, order: 1 as const };
    return { by: "type" as const, order: 1 as const };
  }, [searchParams]);

  const personalWeapons = useMemo<EnrichedWeapon[]>(() => {
    return weaponList
      .filter((item) => item.type === "WeaponPersonal")
      .map((item) => ({
        ...item,
        sort: {
          maxDPS: getMaxDps(item),
        },
      }));
  }, []);

  const grouped = useMemo<Record<GunType, EnrichedWeapon[]>>(() => {
    const groupedInit: Record<GunType, EnrichedWeapon[]> = {
      HG: [],
      SMG: [],
      AR: [],
      SG: [],
      SR: [],
      LMG: [],
      GL: [],
      Heavy: [],
      Other: [],
    };
    for (const item of personalWeapons) {
      groupedInit[classifyGun(item)].push(item);
    }
    for (const key of Object.keys(groupedInit) as GunType[]) {
      groupedInit[key].sort((a, b) => a.stdItem.Name.localeCompare(b.stdItem.Name));
    }
    return groupedInit;
  }, [personalWeapons]);

  const sortedByDps = useMemo(() => {
    return [...personalWeapons].sort((a, b) => sortMode.order * (a.sort.maxDPS - b.sort.maxDPS));
  }, [personalWeapons, sortMode.order]);

  const resolveDisplayName = (item: EnrichedWeapon) => {
    const key = item.name?.startsWith("@") ? item.name.slice(1).toLowerCase() : "";
    if (key) {
      const fallbackVehicleItem = tItem(key, { defaultValue: "" });
      return tPw(key, {
        defaultValue: fallbackVehicleItem || item.stdItem.Name || item.className,
      });
    }
    const byClassName = tItem(`item_name${item.className}`.toLowerCase(), { defaultValue: "" });
    return byClassName || item.stdItem.Name || item.className;
  };

  const renderItem = (item: EnrichedWeapon) => (
    <div key={item.className} className="item" onClick={() => navigate(`/PW/${item.className}`)}>
      {/* <div className="size-badge">{sizeLabel(item.stdItem.Size)}</div> */}
      <div className="contents">
        <p className="name">{resolveDisplayName(item)}</p>
        <p className="name-small">{item.stdItem.Name}</p>
        <p className="value">
          <span>{Math.round(item.sort.maxDPS)}</span> {tpw("FPSSort-MaxDPS", "Max DPS")}
        </p>
      </div>
      <div
        className="thumbnail"
        style={{ backgroundImage: `url(${personalWeaponsImg[item.className as keyof typeof personalWeaponsImg] ?? ""})` }}
      />
      <div className="value-bar" style={{ width: `${(item.sort.maxDPS / 500) * 100}%` }} />
    </div>
  );

  return (
    <div className="Index-Personal-Wpn-container">
      <div className="sort-selector">
        <button
          onClick={() => {
            searchParams.delete("sort");
            setSearchParams(searchParams, { replace: true });
          }}
          className={sortMode.by === "type" ? "active" : ""}
        >
          {tpw("FPSSort-Type", "Weapon Type")}
        </button>
        <button
          onClick={() => {
            if (sortMode.by !== "dps") {
              searchParams.set("sort", "maxDPS-");
            } else {
              searchParams.set("sort", sortMode.order > 0 ? "maxDPS-" : "maxDPS");
            }
            setSearchParams(searchParams, { replace: true });
          }}
          className={sortMode.by === "dps" ? "active" : ""}
        >
          {tpw("FPSSort-MaxDPS", "Max DPS")}
          {sortMode.by === "dps" && sortMode.order > 0 ? (
            <Icon path={mdiSortAscending} size={1} />
          ) : (
            <Icon path={mdiSortDescending} size={1} />
          )}
        </button>
      </div>
      <div className="group-list">
        {sortMode.by === "dps" ? (
          <div className="item-list">{sortedByDps.map(renderItem)}</div>
        ) : (
          gunTypes.map((group) => (
            <div key={group}>
              <p>{tpw(`GunType-${group}`, group)}</p>
              <div className="item-list">{grouped[group].map(renderItem)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
