import { GraduationCap, PenLine, BookOpen, Building2, type LucideIcon } from "lucide-react";
import type { HubItemType } from "./mock-data";

export const ITEM_TYPE_META: Record<HubItemType, { label: string; Icon: LucideIcon }> = {
  ib_component: { label: "IB Assessment", Icon: GraduationCap },
  task: { label: "Personal Task", Icon: PenLine },
  study_block: { label: "Study Block", Icon: BookOpen },
  university: { label: "University Deadline", Icon: Building2 },
};
