import { useEffect, useState, type ReactNode } from "react";
import { mdiClose } from "@mdi/js";
import Icon from "@mdi/react";
import { useTranslation } from "react-i18next";
import attachmentListRaw from "../../../data/fps-weapon-attachment-list.json";
import styles from "./PortEditable.module.css";

const attachmentList = attachmentListRaw as unknown as WeaponAttachmentList;
const attachmentByClassName = new Map<string, WeaponAttachment>();
for (const item of attachmentList) {
  attachmentByClassName.set(item.ClassName, item);
}

type PortEditableProps = {
  data?: PortInfo;
  name: string;
  icon: ReactNode;
  weaponClassName: string;
};

const attachmentSubtypeByPortName: Record<string, WeaponAttachmentSubType | undefined> = {
  magazine_attach: "Magazine",
  optics_attach: "IronSight",
  barrel_attach: "Barrel",
  underbarrel_attach: "BottomAttachment",
};

function sizeLabel(size: number) {
  return `S${size}`;
}

export default function PortEditable({ data, name, icon, weaponClassName }: PortEditableProps) {
  const [windowActive, setWindowActive] = useState(false);
  const [listAttachments, setListAttachments] = useState<WeaponAttachment[]>([]);
  const { t: tUi } = useTranslation("ui");
  const { t: tPw } = useTranslation("pw");
  const tUiPW = (key: string, defaultValue: string) =>
    tUi(`PersonalWeapon.${key}`, { defaultValue });

  useEffect(() => {
    if (!data) {
      setListAttachments([]);
      return;
    }
    const subtype = attachmentSubtypeByPortName[name];
    if (!subtype) {
      setListAttachments([]);
      return;
    }
    const available = attachmentList.filter(
      (item) =>
        item.SubType === subtype &&
        item.Size >= data.MinSize &&
        item.Size <= data.MaxSize &&
        (name !== "magazine_attach" || item.ForWeapons?.includes(weaponClassName) === true),
    );
    setListAttachments(available);
  }, [data, name, weaponClassName]);

  const installedAttachment = data?.DefaultInstalled ? attachmentByClassName.get(data.DefaultInstalled) : undefined;

  if (!data) {
    return (
      <div className={`${styles.container} ${styles.invalid}`}>
        <div className={styles.port}>
          <p>N/A</p>
        </div>
        <div className={styles.title}>
          {icon}
          <p>{tUiPW(name, name)}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.port} onClick={() => setWindowActive(true)}>
          {installedAttachment ? (
            <div className={styles.item}>
              <p className={styles.itemName}>
                {tPw("item_name" + installedAttachment.ClassName, installedAttachment.Name)}
              </p>
            </div>
          ) : (
            <p>EMPTY</p>
          )}
        </div>
        <div className={styles.title}>
          {icon}
          <p>{tUiPW(name, name)}</p>
          <span>{sizeLabel(data.MaxSize)}</span>
        </div>
      </div>
      <div className={`${styles.windowContainer} ${windowActive ? styles.active : ""}`}>
        <div className={`${styles.windowBg} ${windowActive ? styles.active : ""}`} onClick={() => setWindowActive(false)} />
        <div className={`${styles.window} ${windowActive ? styles.active : ""}`}>
          <div className={styles.nav}>
            <div className={styles.icon}>{icon}</div>
            <p>{tUiPW(name, name)}</p>
            <div className={styles.size}>{sizeLabel(data.MaxSize)}</div>
            <div className={styles.grow} />
            <div className={styles.close} onClick={() => setWindowActive(false)}>
              <Icon path={mdiClose} />
            </div>
          </div>
          <div className={styles.contents}>
            {installedAttachment && (
              <div className={styles.port}>
                <div className={styles.installed}>
                  <p className={styles.itemName}>
                    {tPw("item_name" + installedAttachment.ClassName, installedAttachment.Name)}
                  </p>
                </div>
              </div>
            )}
            <p className={styles.attachmentsListTitle}>
              {listAttachments.length > 0
                ? tUiPW("Available Attachments", "Available Attachments")
                : tUiPW("No Other Available Attachments", "No Other Available Attachments")}
            </p>
            <div className={styles.list}>
              {listAttachments.map((item) => (
                <div className={styles.attachment} key={item.ClassName}>
                  <p>{tPw("item_name" + item.ClassName, item.Name)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
