import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import vehicleBasicListRaw from "../../data/vehicle-basic-list.json";
import styles from "./Home.module.css";
import { getImageSrc } from "../../utils/getImageSrc";

const vehicleBasicList = vehicleBasicListRaw as unknown as SpvVehicleBasic[];

export default function Home() {

  const { t: tm } = useTranslation("manufacturer");
  const { t: tv } = useTranslation("vehicle");

  // group by Manufacturer
  const groups = vehicleBasicList.reduce((acc: Record<string, SpvVehicleBasic[]>, s: SpvVehicleBasic) => {
    const key = s.Manufacturer || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {} as Record<string, SpvVehicleBasic[]>);

  const getStorePrice = (ship: SpvVehicleBasic) => {
    const buy = ship.Store?.Buy;
    return typeof buy === "number" ? buy : Number.POSITIVE_INFINITY;
  };

  Object.values(groups).forEach((group) => group.sort((a, b) => getStorePrice(a) - getStorePrice(b)));

  const manufacturerKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

  const shorten = (name: string) => {
    const parts = name.split(" ");
    if (parts.length <= 1) return name;
    return parts.slice(1).join(" ");
  };

  return (
    <div className={styles.homePage}>
      {manufacturerKeys.map((manu) => (
        <section key={manu} className={styles.group}>
          <h2 className={styles.groupTitle}>{tm(manu, { defaultValue: manu })}</h2>
          <ul className={styles.list}>
            {groups[manu].map((s: SpvVehicleBasic) => (
              <li
                key={s.ClassName}
                className={styles.item}
              >
                <img
                  className={styles.thumbnail}
                  src={getImageSrc(s.ClassName, "top")}
                  loading="lazy"
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <Link to={`/vehicle/${encodeURIComponent(s.ClassName)}`} className={styles.link}>
                  <div className={styles.name}>
                    {shorten(tv(s.ClassName, { defaultValue: s.Name }))}
                  </div>
                  <div className={styles.nameOriginal}>{shorten(s.Name)}</div>
                  {s.Store.Buy ?
                    <div className={styles.priceRSI}>{s.Store.Buy} <span>USD</span></div>
                    :
                    <div className={styles.priceRSINull}>暂无定价</div>
                  }
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
