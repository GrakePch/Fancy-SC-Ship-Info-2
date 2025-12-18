import styles from "./QuantumTravel.module.css";
import { useTranslation } from "react-i18next";
import vehicleItemListRaw from "../../data/vehicle-item-list.json";
import qtTime from "../../utils/qtTimeCalculator";
import formatTime from "../../utils/formatTime";
import Icon from "@mdi/react";
import icons from "../../assets/icons";

const vehicleItemList = vehicleItemListRaw as unknown as any[];

type QuantumTravelProps = {
  fuelCapacity: number;
  vItem: any;
};

const mapConsumptionScuPerGmSpecial: Record<string, number> = {
  QDRV_ORIG_S04_890J_SCItem: 0.047,
  QDRV_WETK_S04_Idris_TEMP: 0.075,
  QDRV_AEGS_S04_Javelin_SCItem: 0.12,
};

const mapConsumptionScuPerGm: Record<number, Record<number, number>> = {
  1: {
    1: 0.014,
    2: 0.012,
    3: 0.01,
    4: 0.008,
  },
  2: {
    1: 0.011,
    2: 0.013,
    3: 0.016,
    4: 0.019,
  },
  3: {
    1: 0.018,
    2: 0.021,
    3: 0.026,
    4: 0.031,
  },
};

const distCrusaderToHurstonGm = 31.92;
const distMicroTechToPyroGatewayGm = 67.97;
const distTerminusToEndgameGm = 136.49;

const QuantumTravel = ({ fuelCapacity, vItem }: QuantumTravelProps) => {
  const { t } = useTranslation();
  const { t: tvi } = useTranslation("vehicle_item");

  // console.log(vItem);

  const name = vItem.stdItem.Name;
  const size = vItem.stdItem.Size;
  const gradePrimary = vItem.stdItem.Class || "?";
  const gradeSecondary = vItem.stdItem.Grade ? String.fromCharCode(64 + vItem.stdItem.Grade) : "?";
  const grade = t(gradePrimary) + " - " + gradeSecondary;

  const infoQuantumDrive = vItem.stdItem.QuantumDrive;

  const speedMaxMps = infoQuantumDrive.StandardJump.Speed; // in m/s
  const accelStage1 = infoQuantumDrive.StandardJump.Stage1AccelerationRate;
  const accelStage2 = infoQuantumDrive.StandardJump.State2AccelerationRate; // Not a typo lol

  const consumptionScuPerGm =
    mapConsumptionScuPerGmSpecial[vItem.stdItem.ClassName] ||
    mapConsumptionScuPerGm[vItem.stdItem.Size]?.[vItem.stdItem.Grade] ||
    0;

  // const listAllQuantumDrives = vehicleItemList.filter((item: any) => item.type === "QuantumDrive");

  // Crusader to Hurston
  const consumptionCrusaderToHurstonScu = consumptionScuPerGm * distCrusaderToHurstonGm;
  const consumptionCrusaderToHurstonPercent =
    (consumptionCrusaderToHurstonScu / fuelCapacity) * 100;
  const timeCrusaderToHurstonS = qtTime(
    distCrusaderToHurstonGm * 1e9,
    speedMaxMps,
    accelStage1,
    accelStage2
  );
  const timeCrusaderToHurstonFormatted = formatTime(timeCrusaderToHurstonS);

  // MicroTech to Pyro Gateway
  const consumptionMicroTechToPyroGatewayScu = consumptionScuPerGm * distMicroTechToPyroGatewayGm;
  const consumptionMicroTechToPyroGatewayPercent =
    (consumptionMicroTechToPyroGatewayScu / fuelCapacity) * 100;
  const timeMicroTechToPyroGatewayS = qtTime(
    distMicroTechToPyroGatewayGm * 1e9,
    speedMaxMps,
    accelStage1,
    accelStage2
  );
  const timeMicroTechToPyroGatewayFormatted = formatTime(timeMicroTechToPyroGatewayS);

  // Terminus to Endgame
  const consumptionTerminusToEndgameScu = consumptionScuPerGm * distTerminusToEndgameGm;
  const consumptionTerminusToEndgamePercent =
    (consumptionTerminusToEndgameScu / fuelCapacity) * 100;
  const timeTerminusToEndgameS = qtTime(
    distTerminusToEndgameGm * 1e9,
    speedMaxMps,
    accelStage1,
    accelStage2
  );
  const timeTerminusToEndgameFormatted = formatTime(timeTerminusToEndgameS);

  const percentStyle = (prct: number) => ({
    color: prct < 100 ? "var(--color-nav-mode)" : "var(--color-red)",
  });

  return (
    <div className={styles.container}>
      <div className={styles.sectionInstalledInfo}>
        <Icon path={icons.quantum_drive} size="1.5rem" />
        <div className={styles.name}>{tvi(name)}</div>
        <div
          className={styles.grade}
          style={{
            color: gradePrimary ? `var(--color-${gradePrimary.toLocaleLowerCase()})` : "inherit",
          }}
        >
          {grade}
        </div>
        <div className={styles.icon}>S{size}</div>
      </div>

      <div className={styles.sectionCommonInfo}>
        <div className={styles.commonKeyValue}>
          <div>{t("QuantumTravel.MaxSpeed")}</div>
          <div>{(speedMaxMps * 1e-9).toFixed(1)} Gm/s</div>
        </div>
        <div className={styles.commonKeyValue}>
          <div>{t("QuantumTravel.ConsumptionPerGm")}</div>
          <div>{consumptionScuPerGm.toFixed(3)} SCU</div>
        </div>
        <div className={styles.commonKeyValue}>
          <div>{t("QuantumTravel.FuelCapacity")}</div>
          <div>{fuelCapacity.toFixed(1)} SCU</div>
        </div>

        <FuelCapacityBar totalWidth={fuelCapacity} segmentWidth={consumptionCrusaderToHurstonScu} />

        <div className={styles.commonKeyValue}>
          <div>{t("QuantumTravel.CrusaderToHurston")}</div>
          <div>{distCrusaderToHurstonGm} Gm</div>
        </div>
        <div className={styles.commonKeyValue}>
          <div>
            <b>{timeCrusaderToHurstonFormatted}</b>
          </div>
          <div style={percentStyle(consumptionCrusaderToHurstonPercent)}>
            {consumptionCrusaderToHurstonPercent.toFixed(1)} %
          </div>
        </div>

        <FuelCapacityBar
          totalWidth={fuelCapacity}
          segmentWidth={consumptionMicroTechToPyroGatewayScu}
        />

        <div className={styles.commonKeyValue}>
          <div>{t("QuantumTravel.MicroTechToPyroGateway")}</div>
          <div>{distMicroTechToPyroGatewayGm} Gm</div>
        </div>
        <div className={styles.commonKeyValue}>
          <div>
            <b>{timeMicroTechToPyroGatewayFormatted}</b>
          </div>
          <div style={percentStyle(consumptionMicroTechToPyroGatewayPercent)}>
            {consumptionMicroTechToPyroGatewayPercent.toFixed(1)} %
          </div>
        </div>

        <FuelCapacityBar totalWidth={fuelCapacity} segmentWidth={consumptionTerminusToEndgameScu} />

        <div className={styles.commonKeyValue}>
          <div>{t("QuantumTravel.TerminusToEndgame")}</div>
          <div>{distTerminusToEndgameGm} Gm</div>
        </div>
        <div className={styles.commonKeyValue}>
          <div>
            <b>{timeTerminusToEndgameFormatted}</b>
          </div>
          <div style={percentStyle(consumptionTerminusToEndgamePercent)}>
            {consumptionTerminusToEndgamePercent.toFixed(1)} %
          </div>
        </div>
      </div>
    </div>
  );
};

const FuelCapacityBar = ({
  totalWidth,
  segmentWidth,
}: {
  totalWidth: number;
  segmentWidth: number;
}) => {
  const segmentNum = Math.floor(totalWidth / segmentWidth);
  const lastSegmentWidth = totalWidth % segmentWidth;
  return (
    <div className={styles.fuelCapacityBar}>
      {[...Array(segmentNum)].map((_, i) => (
        <div
          key={i}
          className={styles.segment}
          style={{ width: `${(segmentWidth / totalWidth) * 100}%` }}
        />
      ))}
      {lastSegmentWidth > 0 && (
        <div
          className={styles.remainder}
          style={{ width: `${(lastSegmentWidth / totalWidth) * 100}%` }}
        />
      )}
    </div>
  );
};

export default QuantumTravel;
