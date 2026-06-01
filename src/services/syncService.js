import useLeadStore from "../stores/leadStore";
import useAdvertiserStore from "../stores/advertiserStore";

/**
 * 声明式同步规则
 * 每条规则定义：当 source 实体的某个字段变更时，自动更新 target 实体的对应字段
 */
const SYNC_RULES = [
  // 规则1: Lead.assignedTo 变更 → 同步到关联的 Advertiser
  {
    source: "lead",
    field: "assignedTo",
    target: "advertiser",
    matchBy: (leadId, advertiser) => advertiser.leadId === leadId,
    apply: (newValue) => ({ assignedTo: newValue }),
  },
  // 规则2: Advertiser.assignedTo 变更 → 同步回关联的 Lead
  {
    source: "advertiser",
    field: "assignedTo",
    target: "lead",
    matchBy: (advertiserId, lead, data) => lead.id === data.leadId,
    apply: (newValue) => ({ assignedTo: newValue }),
  },
];

/**
 * 执行所有匹配的同步规则
 */
export function executeSync(sourceType, sourceId, field, newValue, extraData = {}) {
  const rules = SYNC_RULES.filter(
    (r) => r.source === sourceType && r.field === field
  );

  for (const rule of rules) {
    const leadStore = useLeadStore.getState();
    const adStore = useAdvertiserStore.getState();

    if (rule.target === "advertiser") {
      const advertisers = adStore.advertisers.map((a) =>
        rule.matchBy(sourceId, a) ? { ...a, ...rule.apply(newValue) } : a
      );
      adStore.setAdvertisers(advertisers);
    } else if (rule.target === "lead") {
      const leads = leadStore.leads.map((l) =>
        rule.matchBy(sourceId, l, extraData) ? { ...l, ...rule.apply(newValue) } : l
      );
      leadStore.setLeads(leads);
    }
  }
}
