// Shared row shape + mappers between `HubItem` (client, real Date objects —
// see mock-data.ts for why) and the snake_case, ISO-string shape used both
// by the `hub_items` DB table and by guest localStorage. Kept in a plain
// module (no "use server"/"use client" directive) so both the server
// actions in app/lib/actions/hub.ts and the client code in hub.tsx can
// import the exact same serialize/deserialize pair — one wire format, not
// three ad hoc ones.
import type { HubItem, HubItemStatus, HubItemType, SubjectId, Stage } from "./mock-data";

export type HubItemRow = {
  id: string;
  title: string;
  type: HubItemType;
  subject_id: SubjectId | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  status: HubItemStatus;
  stages: Stage[];
  notes: string;
  resource_ids: string[];
  weight_label: string | null;
};

export function hubItemToRow(item: HubItem): HubItemRow {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    subject_id: item.subjectId,
    start_at: item.start.toISOString(),
    end_at: item.end.toISOString(),
    all_day: item.allDay,
    status: item.status,
    stages: item.stages,
    notes: item.notes,
    resource_ids: item.resourceIds,
    weight_label: item.weightLabel ?? null,
  };
}

export function rowToHubItem(row: HubItemRow): HubItem {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    subjectId: row.subject_id,
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    allDay: row.all_day,
    status: row.status,
    stages: row.stages,
    notes: row.notes,
    resourceIds: row.resource_ids,
    weightLabel: row.weight_label ?? undefined,
  };
}
