import DefaultForm from "./default/form";
import { toOphCanonical } from "./oph/canonical";
import OphForm from "./oph/form";
import OphPreview from "./oph/preview";

//import GenForm from "./gen/form";
//import GynForm from "./gyn/form";

export function getDigitalRxPlugin(dept: string) {
  switch (dept) {
    case "oph":
      return {
        Form: OphForm,
        canonical: toOphCanonical,
        Preview: OphPreview,
      };
    // case "gyn":
    //   return {
    //     Form: GynForm,
    //     canonical: (s: any) => s,
    //     Preview: null,
    //   };
    // case "gen":
    //   return {
    //     Form: GenForm,
    //     canonical: (s: any) => s,
    //     Preview: null,
    //   };
    default:
      return {
        Form: DefaultForm,
        canonical: (s: any) => s,
        Preview: null,
      };
  }
}
