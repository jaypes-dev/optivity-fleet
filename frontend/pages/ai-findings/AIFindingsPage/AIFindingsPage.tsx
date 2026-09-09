/** AI service usage by host -- a consolidated view of the
 * "No unauthorized AI tool detected: X" policies (see
 * optivity-shadow-ai-scanner's packs/fleet-policies.yml), which Fleet
 * otherwise only shows one-service-at-a-time (a policy's own "hosts
 * failing" list) or one-host-at-a-time (a host's own Policies tab).
 *
 * Deliberately reuses existing, already-working backend endpoints --
 * globalPoliciesAPI.loadAll() and hostsAPI.loadHosts({policyId,
 * policyResponse: "failing"}) are the exact calls Fleet's own
 * PolicyDetailsPage already makes -- rather than adding any new backend
 * code. Table chrome (TableContainer + TextCell/StatusIndicatorWithIcon)
 * matches the Policies page's own look, rather than a bare HTML table.
 */
import React from "react";
import { useQuery } from "react-query";

import MainContent from "components/MainContent";
import Spinner from "components/Spinner";
import DataError from "components/DataError";
import TableContainer from "components/TableContainer";
import EmptyState from "components/EmptyState";

import globalPoliciesAPI from "services/entities/global_policies";
import hostsAPI from "services/entities/hosts";
import { IPolicyStats } from "interfaces/policy";

import { generateTableHeaders, generateDataSet } from "./AIFindingsTableConfig";

const baseClass = "ai-findings-page";
const AI_POLICY_PREFIX = "No unauthorized AI tool detected: ";

interface IServiceHosts {
  serviceName: string;
  hostnames: string[];
}

const AIFindingsPage = (): JSX.Element => {
  const {
    data: aiPolicies,
    isLoading: isLoadingPolicies,
    isError: isErrorPolicies,
  } = useQuery(["ai-findings-policies"], () => globalPoliciesAPI.loadAll(), {
    select: (res) =>
      (res.policies || []).filter((p: IPolicyStats) =>
        p.name.startsWith(AI_POLICY_PREFIX)
      ),
  });

  const policies = aiPolicies || [];

  const { data: serviceHosts, isLoading: isLoadingHosts } = useQuery(
    ["ai-findings-hosts", policies.map((p) => p.id).join(",")],
    async (): Promise<IServiceHosts[]> =>
      Promise.all(
        policies.map(async (p) => {
          const res = await hostsAPI.loadHosts({
            policyId: p.id,
            policyResponse: "failing",
            page: 0,
            perPage: 500,
          });
          return {
            serviceName: p.name.replace(AI_POLICY_PREFIX, ""),
            hostnames: res.hosts.map((h) => h.hostname),
          };
        })
      ),
    { enabled: policies.length > 0 }
  );

  const isLoading = isLoadingPolicies || isLoadingHosts;
  const services = serviceHosts || [];
  const tableHeaders = generateTableHeaders(services.map((s) => s.serviceName));
  const tableData = generateDataSet(services);

  if (isErrorPolicies) {
    return (
      <MainContent className={baseClass}>
        <DataError />
      </MainContent>
    );
  }

  return (
    <MainContent className={baseClass}>
      <h1>AI findings</h1>
      <p>
        Which process-detectable AI services have been found on which host,
        consolidated from the individual &quot;No unauthorized AI tool
        detected&quot; policies.
      </p>
      {!isLoading && services.length === 0 ? (
        <EmptyState
          header="No AI-detection policies configured"
          info="Apply packs/fleet-policies.yml from optivity-shadow-ai-scanner to see findings here."
        />
      ) : (
        <TableContainer
          columnConfigs={tableHeaders}
          data={tableData}
          isLoading={isLoading}
          resultsTitle="hosts"
          emptyComponent={() => (
            <EmptyState
              header="No AI tools detected"
              info="None of the configured AI-detection policies are currently failing on any host."
            />
          )}
          defaultSortHeader="hostname"
          defaultSortDirection="asc"
          showMarkAllPages={false}
          isAllPagesSelected={false}
          disableMultiRowSelect
          disableCount
        />
      )}
    </MainContent>
  );
};

export default AIFindingsPage;
