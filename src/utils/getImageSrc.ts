import shipIndex from "../data/vehicle-basic-list";

const nameFix: Record<string, string> = {
  ANVL_Hornet_F7A_Mk1: "f7a-hornet",
  ANVL_Hornet_F7A_Mk2: "f7a-mkii",
  ANVL_Hornet_F7C: "f7c-hornet",
  ANVL_Hornet_F7C_Mk2: "f7c-mkii",
  AEGS_Retaliator: "retaliator-bomber",
  AEGS_Gladius_PIR: "pirate-gladius",
  RSI_Zeus_CL: "zeus-mkii-cl",
  RSI_Zeus_ES: "zeus-mkii-es",
  RSI_Zeus_MR: "zeus-mkii-mr",
  RSI_Polaris_FW: "polaris",
  CNOU_Pionneer: "pioneer",
};

export const getImageSrc = (className: string, angle: "top" | "iso" = "top") => {
  let queryName = nameFix[className] || null;

  if (!queryName) {
    // use the name of the index.js data, but remove the first word (manufacturer)
    const name = shipIndex.find((s: any) => s.ClassName.toLocaleLowerCase() === className.toLocaleLowerCase())?.Name.trimEnd() || "";

    const parts = name.split(" ");
    if (parts.length > 1) {
      parts.shift();
      queryName = parts.join("-");
      queryName = queryName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replaceAll("'", "-")
        .replaceAll(".", "-")
        .toLowerCase()
        .trimEnd();
    }
  }

  return `https://ships.42kit.com/resized/${queryName}%20${angle}.png`;
};
