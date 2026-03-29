import { useEffect, useState, type ReactNode } from "react";
import { mdiClose } from "@mdi/js";
import Icon from "@mdi/react";
import { useTranslation } from "react-i18next";
import weaponListRaw from "../../../data/fps-weapon-list.json";
import "./PortEditable.css";

type PortInstalledItem = {
  ClassName: string;
};

type PortData = {
  Types: string[];
  MinSize: number;
  MaxSize: number;
  InstalledItem?: PortInstalledItem;
};

type FpsAttachmentItem = {
  className: string;
  name?: string;
  size: number;
  stdItem: {
    ClassName: string;
    Name: string;
    Type: string;
  };
};

const weaponList = weaponListRaw as unknown as FpsAttachmentItem[];
const pwNameKeyByClassName = new Map<string, string>();
for (const item of weaponList) {
  const normalizedClassName = item.className?.toLowerCase();
  const normalizedStdClassName = item.stdItem.ClassName?.toLowerCase();
  const key = item.name?.startsWith("@") ? item.name.slice(1).toLowerCase() : "";
  if (!key) continue;
  if (normalizedClassName) pwNameKeyByClassName.set(normalizedClassName, key);
  if (normalizedStdClassName) pwNameKeyByClassName.set(normalizedStdClassName, key);
}

type PortEditableProps = {
  data?: PortData;
  name: string;
  icon: ReactNode;
};

function sizeLabel(size: number) {
  return `S${size}`;
}

export default function PortEditable({ data, name, icon }: PortEditableProps) {
  const [windowActive, setWindowActive] = useState(false);
  const [listAttachments, setListAttachments] = useState<FpsAttachmentItem[]>([]);
  const { t: tUi } = useTranslation("ui");
  const { t: tPw } = useTranslation("pw");
  const { t: tItem } = useTranslation("vehicle_item");
  const tpw = (key: string, defaultValue: string) =>
    tUi(`PersonalWeapon.${key}`, { defaultValue });

  useEffect(() => {
    if (!data) {
      setListAttachments([]);
      return;
    }
    const type = data.Types[0];
    const available = weaponList.filter(
      (item) => item.stdItem.Type === type && item.size >= data.MinSize && item.size <= data.MaxSize,
    );
    setListAttachments(available);
  }, [data]);

  const resolveItemName = (className: string, fallback: string) => {
    const normalizedClassName = className.toLowerCase();
    const mappedPwNameKey = pwNameKeyByClassName.get(normalizedClassName);
    if (mappedPwNameKey) {
      const vehicleItemFallback = tItem(mappedPwNameKey, { defaultValue: "" });
      return tPw(mappedPwNameKey, { defaultValue: vehicleItemFallback || fallback || className });
    }
    const vehicleItemByClass = tItem(`item_name${normalizedClassName}`, { defaultValue: "" });
    return vehicleItemByClass || fallback || className;
  };

  if (!data) {
    return (
      <div className="PortEditable-container invalid">
        <div className="port">
          <p>N/A</p>
        </div>
        <div className="title">
          <p>{tpw(name, name)}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="PortEditable-container">
        <div className="port" onClick={() => setWindowActive(true)}>
          {data.InstalledItem ? (
            <div className="item">
              <p className="item-name">
                {resolveItemName(data.InstalledItem.ClassName, data.InstalledItem.ClassName)}
              </p>
            </div>
          ) : (
            <p>EMPTY</p>
          )}
        </div>
        <div className="title">
          {icon}
          <p>{tpw(name, name)}</p>
          <span>{sizeLabel(data.MaxSize)}</span>
        </div>
      </div>
      <div className={`PortEditable-window-container ${windowActive ? "active" : ""}`}>
        <div className={`PortEditable-window-bg ${windowActive ? "active" : ""}`} onClick={() => setWindowActive(false)} />
        <div className={`PortEditable-window ${windowActive ? "active" : ""}`}>
          <div className="nav">
            <div className="icon">{icon}</div>
            <p>{tpw(name, name)}</p>
            <div className="size">{sizeLabel(data.MaxSize)}</div>
            <div className="grow" />
            <div className="close" onClick={() => setWindowActive(false)}>
              <Icon path={mdiClose} />
            </div>
          </div>
          <div className="contents">
            {data.InstalledItem && (
              <div className="port">
                <div className="installed">
                  <p className="item-name">
                    {resolveItemName(data.InstalledItem.ClassName, data.InstalledItem.ClassName)}
                  </p>
                </div>
              </div>
            )}
            <p className="attachments-list-title">
              {listAttachments.length > 0
                ? tpw("Available Attachments", "Available Attachments")
                : tpw("No Other Available Attachments", "No Other Available Attachments")}
            </p>
            <div className="list">
              {listAttachments.map((item) => (
                <div className="attachment" key={item.className}>
                  <p>{resolveItemName(item.stdItem.ClassName, item.stdItem.Name)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
