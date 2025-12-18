import { useParams, Navigate } from "react-router-dom";
import styles from "./Vehicle.module.css";
import { getImageSrc } from "../../utils/getImageSrc";
import vehicleBasicListRaw from "../../data/vehicle-basic-list.json";
import vehicleMainListRaw from "../../data/vehicle-main-list.json";
import vehicleHardpointsListRaw from "../../data/vehicle-hardpoints-list.json";
import vehicleItemListRaw from "../../data/vehicle-item-list.json";
import { useEffect, useState } from "react";
import FlightAccelerations from "../../components/FlightAccelerations/FlightAccelerations";
import FlightVelocities from "../../components/FlightVelocities/FlightVelocities";
import { useTranslation } from "react-i18next";
import SimpleWeaponGroup from "../../components/SimpleWeaponGroup/SimpleWeaponGroup";
import QuantumTravel from "../../components/QuantumTravel/QuantumTravel";
import Icon from "@mdi/react";
import {
  mdiAxisArrow,
  mdiCubeScan,
  mdiCurrencySign,
  mdiFileDocumentArrowRightOutline,
  mdiFileDocumentOutline,
  mdiWeight,
} from "@mdi/js";
import formatTime from "../../utils/formatTime";
import formatLongNumber from "../../utils/formatLongNumber";
import icons from "../../assets/icons";
import iconsManufacturerSmall from "../../assets/iconsManufacturerSmall";

const vehicleBasicList = vehicleBasicListRaw as unknown as SpvVehicleBasic[];
const vehicleMainList = vehicleMainListRaw as unknown as SpvVehicleMain[];
const vehicleHardpointsList = vehicleHardpointsListRaw as unknown as SpvVehicleHardpoints[];
const vehicleItemList = vehicleItemListRaw as unknown as any[];

export default function Vehicle() {
  const { id } = useParams() as { id?: string };
  const heroImageSrc = id ? getImageSrc(id, "iso") : null;
  const [showHeroImage, setShowHeroImage] = useState(false);

  const vInfoBasic = vehicleBasicList.find(
    (s: SpvVehicleBasic) => s.ClassName?.toLocaleLowerCase() === id?.toLocaleLowerCase()
  );
  const vInfoMain = vehicleMainList.find(
    (s: SpvVehicleMain) => s.ClassName?.toLocaleLowerCase() === id?.toLocaleLowerCase()
  );
  const vInfoHardpoints = vehicleHardpointsList.find(
    (s: SpvVehicleHardpoints) => s.ClassName?.toLocaleLowerCase() === id?.toLocaleLowerCase()
  );

  const { t } = useTranslation();
  const { t: tv } = useTranslation("vehicle");
  const { t: tm } = useTranslation("manufacturer");

  if (!vInfoBasic) {
    return <Navigate to="/404" replace />;
  }

  const shorten = (name: string) => {
    const parts = name.split(" ");
    if (parts.length <= 1) return name;
    return parts.slice(1).join(" ");
  };

  /*//// NAME & MANUFACTURER ////*/

  const vehicleShortNameI18n = shorten(tv(vInfoBasic.Name, { defaultValue: vInfoBasic.Name }));
  const vehicleFullNameOriginal = vInfoBasic.Name;
  const manufacturerEn = vInfoBasic.Manufacturer;
  const manufacturerCn = tm(manufacturerEn, { defaultValue: manufacturerEn });

  /*//// RELEASE STATUS & STORE PRICE ////*/

  const releaseStatus = vInfoBasic.ProgressTracker.Status;
  const releaseStatusAtPatch = vInfoBasic.ProgressTracker.Patch
    ? t(releaseStatus) + " @ " + vInfoBasic.ProgressTracker.Patch
    : t(releaseStatus);
  const statusToHue = {
    Concept: 200,
    InProd: 55,
    Released: 105,
    OnHold: 35,
    PU: 55,
    NextPatch: 55,
  } as Record<string, number>;
  const releaseStatusStyle = {
    color: `hsl(${statusToHue[releaseStatus]}, 50%, 50%)`,
    backgroundColor: `hsla(${statusToHue[releaseStatus]}, 100%, 50%, 8%)`,
  };
  const rsiStorePrice = vInfoBasic.Store.Buy ? `${vInfoBasic.Store.Buy} USD` : "暂无定价";

  /*//// IN-GAME PRICE & LOCATION ////*/

  const dictBuyInGame: Record<string, number> = vInfoMain?.Buy || {};
  const listBuyInGameDesc: [string, number][] = Object.entries(dictBuyInGame).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className={styles.vehiclePage}>
      <section className={styles.hero}>
        {showHeroImage && (
          <div className={styles.manuIcon}>{iconsManufacturerSmall[manufacturerEn]}</div>
        )}
        {heroImageSrc && (
          <img
            className={styles.shipImage}
            src={heroImageSrc}
            alt={vehicleFullNameOriginal}
            style={{ display: showHeroImage ? undefined : "none" }}
            onLoad={() => {
              setShowHeroImage(true);
              console.log("image_loaded");
            }}
            onError={() => {
              setShowHeroImage(false);
              console.log("image_not_found");
            }}
          />
        )}
        <div
          className={styles.manufacturer}
          style={{ marginTop: !showHeroImage ? "1.5rem" : undefined }}
        >
          {manufacturerCn}
        </div>
        <div className={styles.vehicleName}>{vehicleShortNameI18n}</div>
        <div className={styles.vehicleManuNameOriginal}>{vehicleFullNameOriginal}</div>
        <div className={styles.designedBy}>UI designed by GrakePCH</div>
      </section>

      <section className={styles.trading}>
        <div className={styles.rsiStore}>
          <div className={styles.releaseStatus} style={releaseStatusStyle}>
            {releaseStatusAtPatch}
          </div>
          <div className={styles.rsiStorePriceLabel}>{t("RsiStore")}</div>
          <div className={styles.rsiStorePrice}>{rsiStorePrice}</div>
        </div>
        <div className={styles.inGameBuy}>
          {listBuyInGameDesc.length > 0
            ? listBuyInGameDesc.map(([location, price], idx) =>
                idx < listBuyInGameDesc.length - 1 ? (
                  <div className={styles.commonKeyValue} key={location}>
                    <div>{t(location)}</div>
                    <div>¤ {formatLongNumber(price)}</div>
                  </div>
                ) : (
                  <div className={styles.heroBuyingOption} key={location}>
                    <div>{t(location)}</div>
                    <div>¤ {formatLongNumber(price)}</div>
                  </div>
                )
              )
            : "游戏内暂无购买渠道"}
        </div>
      </section>

      {vInfoMain && vInfoHardpoints && (
        <VehicleMain vInfoMain={vInfoMain} vInfoHardpoints={vInfoHardpoints} />
      )}
    </div>
  );
}

function VehicleMain({
  vInfoMain,
  vInfoHardpoints,
}: {
  vInfoMain: SpvVehicleMain;
  vInfoHardpoints: SpvVehicleHardpoints;
}) {
  const { t } = useTranslation();
  /*//// INSURANCE ////*/

  const claimTimeStandardSeconds = vInfoMain.Insurance.StandardClaimTime * 60;
  const claimTimeExpeditedSeconds = vInfoMain.Insurance.ExpeditedClaimTime * 60;
  const claimTimeStandardFormatted = formatTime(claimTimeStandardSeconds);
  const claimTimeExpeditedFormatted = formatTime(claimTimeExpeditedSeconds);
  const claimCostExpedited = "¤ " + vInfoMain.Insurance.ExpeditedCost;

  /*//// MISCELLANEOUS ////*/

  const dimLength = vInfoMain.Dimensions.Length;
  const dimWidth = vInfoMain.Dimensions.Width;
  const dimHeight = vInfoMain.Dimensions.Height;

  /*//// COMPONENTS ////*/

  const componentPowerPlants = vInfoHardpoints.Hardpoints.Components.Propulsion.PowerPlants;
  const componentShields = vInfoHardpoints.Hardpoints.Components.Systems.Shields;
  const componentCoolers = vInfoHardpoints.Hardpoints.Components.Systems.Coolers;
  const componentQuantumDrives = vInfoHardpoints.Hardpoints.Components.Propulsion.QuantumDrives;

  /*//// QUANTUM TRAVEL ////*/

  const quantumFuelTotalCapacityScu =
    vInfoHardpoints?.Hardpoints.Components.Propulsion.QuantumFuelTanks.TotalQuantumFuelCapacity ||
    0;
  const quantumDriveClassName: string | undefined =
    componentQuantumDrives?.InstalledItems?.at(0)?.BaseLoadout.ClassName;
  const vItemQuantumDrive: any | undefined = vehicleItemList.find(
    (s: any) => s.className === quantumDriveClassName
  );

  /*//// FLIGHT CHARACTERISTICS ////*/

  const infoFlightCharacteristics = vInfoMain.FlightCharacteristics;
  return (
    <>
      <section className={styles.components}>
        <VehicleComponentsByType type="电源" data={componentPowerPlants} icon="power_plant" />
        <VehicleComponentsByType type="护盾" data={componentShields} icon="shield_generator" />
        <VehicleComponentsByType type="冷却器" data={componentCoolers} icon="cooler" />
        <VehicleComponentsByType
          type="量子引擎"
          data={componentQuantumDrives}
          icon="quantum_drive"
        />
      </section>

      <div className={styles.twoColumn}>
        <section className={styles.leftColumn}>
          <div className={styles.miscellaneous}>
            <div className={styles.commonKeyValue}>
              <Icon path={mdiAxisArrow} />
              <div>{t("Dimensions")}</div>
              <div>{t("LengthXWidthXHeight", { L: dimLength, W: dimWidth, H: dimHeight })}</div>
            </div>
            <div className={styles.commonKeyValue}>
              <Icon path={mdiWeight} />
              <div>{t("Mass")}</div>
              <div>{(vInfoMain.Mass * 1e-3).toFixed(3)} t</div>
            </div>
            <div className={styles.commonKeyValue}>
              <Icon path={mdiCubeScan} />
              <div>{t("CargoGrid")}</div>
              <div>{vInfoMain.Cargo.CargoGrid} SCU</div>
            </div>
          </div>

          {infoFlightCharacteristics && <FlightVelocities spvFC={infoFlightCharacteristics} />}

          {vItemQuantumDrive && (
            <QuantumTravel fuelCapacity={quantumFuelTotalCapacityScu} vItem={vItemQuantumDrive} />
          )}
        </section>
        <section className={styles.rightColumn}>
          <div className={styles.insurance}>
            <div className={styles.commonKeyValue}>
              <Icon path={mdiFileDocumentOutline} />
              <div>标准理赔时间</div>
              <div>{claimTimeStandardFormatted}</div>
            </div>
            <div className={styles.commonKeyValue}>
              <Icon path={mdiFileDocumentArrowRightOutline} />
              <div>加急理赔时间</div>
              <div>{claimTimeExpeditedFormatted}</div>
            </div>
            <div className={styles.commonKeyValue}>
              <Icon path={mdiCurrencySign} />
              <div>加急理赔费用</div>
              <div>{claimCostExpedited}</div>
            </div>
          </div>

          {infoFlightCharacteristics && <FlightAccelerations spvFC={infoFlightCharacteristics} />}

          <SimpleWeaponGroup
            groupName="PilotWeapons"
            icon="guns"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.PilotWeapons}
          />
          <SimpleWeaponGroup
            groupName="MannedTurrets"
            icon="turret_manned"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.MannedTurrets}
          />
          <SimpleWeaponGroup
            groupName="RemoteTurrets"
            icon="turret_remote"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.RemoteTurrets}
          />
          <SimpleWeaponGroup
            groupName="MissileRacks"
            icon="missile"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.MissileRacks}
          />
          <SimpleWeaponGroup
            groupName="BombRacks"
            icon="bomb"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.BombRacks}
          />
          <SimpleWeaponGroup
            groupName="EMP"
            icon="emp"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.InterdictionHardpoints?.EMP}
          />
          <SimpleWeaponGroup
            groupName="QED"
            icon="qed"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.InterdictionHardpoints?.QED}
          />
          <SimpleWeaponGroup
            groupName="PilotMiningHardpoints"
            icon="diamond_stone"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.MiningHardpoints?.PilotControlled}
          />
          <SimpleWeaponGroup
            groupName="CrewMiningHardpoints"
            icon="diamond_stone"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.MiningHardpoints?.CrewControlled}
          />
          <SimpleWeaponGroup
            groupName="PilotSalvageHardpoints"
            icon="recycle"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.SalvageHardpoints?.PilotControlled}
          />
          <SimpleWeaponGroup
            groupName="CrewSalvageHardpoints"
            icon="recycle"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.SalvageHardpoints?.CrewControlled}
          />
          <SimpleWeaponGroup
            groupName="UtilityHardpoints"
            icon="beam"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.UtilityHardpoints}
          />
          <SimpleWeaponGroup
            groupName="UtilityTurrets"
            icon="beam"
            weaponGroupObj={vInfoHardpoints.Hardpoints.Weapons.UtilityTurrets}
          />
        </section>
      </div>
    </>
  );
}

type VehicleComponentsByTypeProps = {
  type: string;
  data: SpvHardpoints;
  icon: string;
};

function VehicleComponentsByType({ type, data, icon }: VehicleComponentsByTypeProps) {
  const { t } = useTranslation();
  const { t: tvi } = useTranslation("vehicle_item");
  const obj = data.InstalledItems?.at(0);
  const baseLoadout = obj?.BaseLoadout;
  const name = baseLoadout ? baseLoadout.Name || "未知" : "无";
  const gradePrimary = baseLoadout?.Class || "?";
  const gradeSecondary =
    baseLoadout && baseLoadout.Grade ? String.fromCharCode(64 + baseLoadout.Grade) : "?";
  const grade = t(gradePrimary) + " - " + gradeSecondary;

  const iconPath =
    icon === "shield_generator" && data.FaceType === "Bubble"
      ? icons.shield_generator_type_bubble
      : icons[icon];

  return (
    <div
      className={styles.component + " " + (baseLoadout ? "" : styles.invalid)}
      style={{
        borderColor: gradePrimary
          ? `var(--color-${gradePrimary.toLocaleLowerCase()})`
          : "transparent",
      }}
    >
      <div className={styles.componentTypeAndIcon}>
        <Icon path={iconPath} size="1.5rem" />
        <div>{type}</div>
      </div>
      <HardpointSizes components={data.InstalledItems} />
      <div className={styles.name}>{tvi(name)}</div>
      <div className={styles.nameOriginal}>{name}</div>
      {baseLoadout && (
        <div
          className={styles.componentGrade}
          style={{
            color: gradePrimary ? `var(--color-${gradePrimary.toLocaleLowerCase()})` : "inherit",
          }}
        >
          {grade}
        </div>
      )}
    </div>
  );
}

type HardpointSizesProps = { components: SpvPort[] | undefined };

function HardpointSizes({ components }: HardpointSizesProps) {
  const [numsOfSizes, setNumsOfSizes] = useState([]);

  useEffect(() => {
    if (components) {
      const temp = [];
      for (let i = 0; i <= 12; ++i) {
        temp.push(0);
      }
      for (let i = 0; i < components.length; ++i) {
        temp[components[i].Size || components[i].MaxSize] += Number(components[i]._Quantity) || 1;
      }
      setNumsOfSizes(temp);
    }
  }, [components]);
  return (
    <div>
      {numsOfSizes.map((count, size) =>
        count <= 0 ? null : (
          <span key={size} className={styles.iconSizeNumWrapper}>
            {Array.from({ length: count }).map((_, idx) => (
              <span key={`${size}-${idx}`} className={styles.iconSizeNum}>
                S{size}
              </span>
            ))}
          </span>
        )
      )}
      {/* {numsOfSizes.reduce((a, b) => a + b, 0) == 0 && (
        <span className={styles.iconSizeNumWrapper}>
          <span
            style={{
              opacity: 0.5,
            }}
            className={styles.iconSizeNum}
          >
            {"∅"}
          </span>
        </span>
      )} */}
    </div>
  );
}
