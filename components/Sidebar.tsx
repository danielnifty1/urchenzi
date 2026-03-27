import { VendorCategory } from "@/types";

type SidebarProps = {
  selected: VendorCategory | "all";
  onChange: (category: VendorCategory | "all") => void;
};

const categories: Array<VendorCategory | "all"> = [
  "all",
  "food",
  "groceries",
  "pharmacy",
  "shops",
];

export const Sidebar = ({ selected, onChange }: SidebarProps) => (
  <aside className="mb-4 flex w-full gap-2 overflow-auto md:mb-0 md:w-56 md:flex-col">
    {categories.map((category) => (
      <button
        key={category}
        onClick={() => onChange(category)}
        className={`rounded-xl px-4 py-2 text-left text-sm capitalize ${
          selected === category
            ? "bg-yellow-400 font-semibold text-slate-900"
            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
      >
        {category}
      </button>
    ))}
  </aside>
);
