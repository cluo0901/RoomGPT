import { Menu, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { roomType, themeType } from "../utils/dropdownTypes";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface DropDownProps {
  theme: themeType | roomType;
  setTheme: (theme: themeType | roomType) => void;
  themes: themeType[] | roomType[];
}

// TODO: Change names since this is a generic dropdown now
export default function DropDown({ theme, setTheme, themes }: DropDownProps) {
  return (
    <Menu as="div" className="relative block text-left">
      <div>
        <Menu.Button className="inline-flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:border-white/30 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
          {theme}
          <ChevronUpIcon
            className="-mr-1 ml-2 h-5 w-5 ui-open:hidden"
            aria-hidden="true"
          />
          <ChevronDownIcon
            className="-mr-1 ml-2 h-5 w-5 hidden ui-open:block"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute left-0 z-20 mt-2 w-full origin-top rounded-2xl border border-white/10 bg-slate-950/95 p-1 text-sm text-white shadow-2xl backdrop-blur focus:outline-none"
          key={theme}
        >
          {themes.map((themeItem) => (
            <Menu.Item key={themeItem}>
              {({ active }) => (
                <button
                  onClick={() => setTheme(themeItem)}
                  className={classNames(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 transition",
                    active ? "bg-white/10" : "",
                    themeItem === theme ? "text-emerald-200" : "text-slate-100"
                  )}
                >
                  <span>{themeItem}</span>
                  {themeItem === theme ? (
                    <CheckIcon className="h-4 w-4 text-emerald-300" />
                  ) : null}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
