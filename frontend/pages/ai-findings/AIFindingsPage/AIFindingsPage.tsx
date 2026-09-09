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
 * code. This page's only job is presenting that data as one matrix
 * instead of many single-service lists.
 */
import React from "react";
import { useQuery } from "react-query";

import MainContent from "components/MainContent";
import Spinner from "components/Spinner";
import DataError from "components/DataError";

import globalPoliciesAPI from "services/entities/global_policies";
import hostsAPI from "services/entities/hosts";
import { IPolicyStats } from "interfaces/policy";

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

  if (isLoadingPolicies || isLoadingHosts) {
    return (
      <MainContent className={baseClass}>
        <Spinner />
      </MainContent>
    );
  }

  if (isErrorPolicies) {
    return (
      <MainContent className={baseClass}>
        <DataError />
      </MainContent>
    );
  }

  const services: IServiceHosts[] = serviceHosts || [];
  const allHostnamesSet = services.reduce((acc: Set<string>, s) => {
    s.hostnames.forEach((h) => acc.add(h));
    return acc;
  }, new Set<string>());
  const allHostnames = Array.from(allHostnamesSet).sort();

  return (
    <MainContent className={baseClass}>
      <h1>AI service usage by host</h1>
      <p>
        Which process-detectable AI services have been found on which host,
        consolidated from the individual &quot;No unauthorized AI tool
        detected&quot; policies.
      </p>
      {services.length === 0 ? (
        <p>No AI-detection policies are configured yet.</p>
      ) : allHostnames.length === 0 ? (
        <p>No AI tools currently detected on any host.</p>
      ) : (
        <table className={`${baseClass}__table`}>
          <thead>
            <tr>
              <th>Host</th>
              {services.map((s) => (
                <th key={s.serviceName}>{s.serviceName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allHostnames.map((hostname) => (
              <tr key={hostname}>
                <td>{hostname}</td>
                {services.map((s) => (
                  <td key={s.serviceName}>
                    {s.hostnames.includes(hostname) ? "Detected" : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </MainContent>
  );
};

export default AIFindingsPage;
