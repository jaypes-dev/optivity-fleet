import React from "react";

import TextCell from "components/TableContainer/DataTable/TextCell";
import StatusIndicatorWithIcon from "components/StatusIndicatorWithIcon";
import { DEFAULT_EMPTY_CELL_VALUE } from "utilities/constants";

export interface IAIFindingsRow {
  hostname: string;
  detections: Record<string, boolean>;
}

interface ICellProps {
  cell: { value: unknown };
}

// One column per AI service, same pass/fail visual language as the
// host-detail Policies tab (StatusIndicatorWithIcon, "failure" = detected)
// so this reads as the same kind of table, not a one-off.
export const generateTableHeaders = (serviceNames: string[]) => [
  {
    title: "Host",
    Header: "Host",
    accessor: "hostname",
    disableSortBy: false,
    Cell: (cellProps: ICellProps) => (
      <TextCell value={cellProps.cell.value as string} />
    ),
  },
  ...serviceNames.map((serviceName) => ({
    title: serviceName,
    Header: serviceName,
    accessor: (row: IAIFindingsRow) => row.detections[serviceName],
    id: serviceName,
    disableSortBy: false,
    Cell: (cellProps: ICellProps) =>
      cellProps.cell.value ? (
        <StatusIndicatorWithIcon value="Detected" status="failure" />
      ) : (
        <>{DEFAULT_EMPTY_CELL_VALUE}</>
      ),
  })),
];

export const generateDataSet = (
  serviceHosts: { serviceName: string; hostnames: string[] }[]
): IAIFindingsRow[] => {
  const allHostnames = Array.from(
    serviceHosts.reduce((acc: Set<string>, s) => {
      s.hostnames.forEach((h) => acc.add(h));
      return acc;
    }, new Set<string>())
  ).sort();

  return allHostnames.map((hostname) => ({
    hostname,
    detections: serviceHosts.reduce((acc: Record<string, boolean>, s) => {
      acc[s.serviceName] = s.hostnames.includes(hostname);
      return acc;
    }, {}),
  }));
};
