import { useEffect, useState, type ReactNode } from "react";
import { mdiClose } from "@mdi/js";
import Icon from "@mdi/react";
import { useTranslation } from "react-i18next";
import attachmentListRaw from "../../../data/fps-weapon-attachment-list.json";
import "./PortEditable.css";

const attachmentList = attachmentListRaw as unknown as WeaponAttachmentList;
const attachmentByClassName = new Map<string, WeaponAttachment>();
for (const item of attachmentList) {
  attachmentByClassName.set(item.ClassName, item);
}

type PortEditableProps = {
  data?: PortInfo;
  name: string;
  icon: ReactNode;
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

export default function PortEditable({ data, name, icon }: PortEditableProps) {
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
      (item) => item.SubType === subtype && item.Size >= data.MinSize && item.Size <= data.MaxSize,
    );
    setListAttachments(available);
  }, [data, name]);

  const installedAttachment = data?.DefaultInstalled ? attachmentByClassName.get(data.DefaultInstalled) : undefined;

  if (!data) {
    return (
      <div className="PortEditable-container invalid">
        <div className="port">
          <p>N/A</p>
        </div>
        <div className="title">
          {icon}
          <p>{tUiPW(name, name)}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="PortEditable-container">
        <div className="port" onClick={() => setWindowActive(true)}>
          {installedAttachment ? (
            <div className="item">
              <p className="item-name">
                {tPw("item_name" + installedAttachment.ClassName, installedAttachment.Name)}
              </p>
            </div>
          ) : (
            <p>EMPTY</p>
          )}
        </div>
        <div className="title">
          {icon}
          <p>{tUiPW(name, name)}</p>
          <span>{sizeLabel(data.MaxSize)}</span>
        </div>
      </div>
      <div className={`PortEditable-window-container ${windowActive ? "active" : ""}`}>
        <div className={`PortEditable-window-bg ${windowActive ? "active" : ""}`} onClick={() => setWindowActive(false)} />
        <div className={`PortEditable-window ${windowActive ? "active" : ""}`}>
          <div className="nav">
            <div className="icon">{icon}</div>
            <p>{tUiPW(name, name)}</p>
            <div className="size">{sizeLabel(data.MaxSize)}</div>
            <div className="grow" />
            <div className="close" onClick={() => setWindowActive(false)}>
              <Icon path={mdiClose} />
            </div>
          </div>
          <div className="contents">
            {installedAttachment && (
              <div className="port">
                <div className="installed">
                  <p className="item-name">
                    {tPw("item_name" + installedAttachment.ClassName, installedAttachment.Name)}
                  </p>
                </div>
              </div>
            )}
            <p className="attachments-list-title">
              {listAttachments.length > 0
                ? tUiPW("Available Attachments", "Available Attachments")
                : tUiPW("No Other Available Attachments", "No Other Available Attachments")}
            </p>
            <div className="list">
              {listAttachments.map((item) => (
                <div className="attachment" key={item.ClassName}>
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
