import { Switch } from "@headlessui/react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export interface ToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  sideBySide: boolean;
  setSideBySide: (sideBySide: boolean) => void;
}

export default function Toggle({
  sideBySide,
  setSideBySide,
  ...props
}: ToggleProps) {
  return (
    <Switch.Group as="div" {...props}>
      <div className="flex items-center">
        <span className={`mr-3 text-sm font-medium ${!sideBySide ? "text-slate-200" : "text-slate-500"}`}>
          Side by side
        </span>
        <Switch
          checked={sideBySide}
          onChange={setSideBySide}
          className={classNames(
            sideBySide ? "bg-emerald-500" : "bg-white/20",
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          )}
        >
          <span
            aria-hidden="true"
            className={classNames(
              sideBySide ? "translate-x-5" : "translate-x-0",
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            )}
          />
        </Switch>
        <Switch.Label as="span" className="ml-3">
          <span className={`text-sm font-medium ${sideBySide ? "text-slate-200" : "text-slate-500"}`}>
            Compare
          </span>
        </Switch.Label>
      </div>
    </Switch.Group>
  );
}
