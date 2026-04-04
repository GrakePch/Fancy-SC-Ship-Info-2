import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import { mdiSortAscending, mdiSortDescending } from "@mdi/js";
import weaponListRaw from "../../data/fps-weapon-personal-list.json";
import PersonalWeaponSelectorItem from "./PersonalWeaponSelectorItem";
import "./PersonalWeaponSelector.css";

const weaponList = weaponListRaw as unknown as WeaponPersonalList;

const tagOrder: WeaponPersonalTag[] = ["HG", "SMG", "AR", "SG", "SR", "LMG", "GL", "Heavy"];

export default function PersonalWeaponSelector() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t: tUi } = useTranslation("ui");
  const tpw = (key: string, defaultValue: string) =>
    tUi(`PersonalWeapon.${key}`, { defaultValue });

  const sortMode = useMemo(() => {
    const mode = searchParams.get("sort");
    if (mode === "maxDPS-") return { by: "dps" as const, order: -1 as const };
    if (mode === "maxDPS") return { by: "dps" as const, order: 1 as const };
    return { by: "type" as const, order: 1 as const };
  }, [searchParams]);

  const grouped = useMemo<Record<WeaponPersonalTag, WeaponPersonal[]>>(() => {
    const groupedInit: Record<WeaponPersonalTag, WeaponPersonal[]> = {
      HG: [],
      SMG: [],
      AR: [],
      SG: [],
      SR: [],
      LMG: [],
      GL: [],
      Heavy: [],
    };
    for (const item of weaponList) {
      groupedInit[item.Tag].push(item);
    }
    for (const key of tagOrder) {
      groupedInit[key].sort((a, b) => a.Name.localeCompare(b.Name));
    }
    return groupedInit;
  }, []);

  const sortedByDps = useMemo(() => {
    return [...weaponList].sort((a, b) => sortMode.order * (a.MaxDps - b.MaxDps));
  }, [sortMode.order]);

  const renderItem = (item: WeaponPersonal) => {
    return <PersonalWeaponSelectorItem key={item.ClassName} item={item} onClick={() => navigate(`/PW/${item.ClassName}`)} />;
  };

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
          tagOrder.map((group) => (
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
