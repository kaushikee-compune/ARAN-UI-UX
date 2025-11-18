import DefaultForm from "../default/form";
import OphComplaints from "./sections/complaints";
import OphInvestigations from "./sections/investigations";

export default function OphForm(props: any) {
  return (
    <DefaultForm
      {...props}
      overrides={{
        complaints: (
          <OphComplaints
            value={props.value}
            onChange={props.onChange}
          />
        ),
        investigation: (
          <OphInvestigations
            value={props.value}
            onChange={props.onChange}
          />
        )
      }}
    />
  );
}
