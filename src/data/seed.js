import { generateId } from "../lib/utils";

const now = new Date();
const d = (days) => new Date(now - days * 86400000).toISOString();

export function generateSeedLeads(salesNames) {
  return [
    { id: generateId(), name: "美肌生物科技有限公司", shopName: "美肌官方旗舰店", contact: "王总", phone: "13800001001", industry: "美妆护肤", clientType: "品牌旗舰店", source: "电销", tier: "S", stage: "推进合作", status: "活跃投放", budgetRange: "500万以上", dailyBudget: 180000, currentConsumption: 4500000, assignedTo: salesNames[0] || "张伟", createdAt: d(120), lastContactAt: d(1), nextContactAt: d(3), remark: "对抖音千川投放有明确需求，正在对比多家代理", riskLevel: "低" },
    { id: generateId(), name: "潮流服饰有限公司", shopName: "潮牌服饰旗舰店", contact: "李经理", phone: "13800001002", industry: "服装服饰", clientType: "中小卖家", source: "转介绍", tier: "A", stage: "已加微", status: "跟进中", budgetRange: "100-500万", dailyBudget: 80000, currentConsumption: 1200000, assignedTo: salesNames[1] || "李娜", createdAt: d(90), lastContactAt: d(3), nextContactAt: d(7), remark: "有初步合作意向，需要进一步沟通细节", riskLevel: "低" },
    { id: generateId(), name: "鲜味食品集团", shopName: "鲜味食品旗舰店", contact: "赵总", phone: "13800001003", industry: "食品饮料", clientType: "品牌旗舰店", source: "公司派单", tier: "S", stage: "已成交", status: "活跃投放", budgetRange: "500万以上", dailyBudget: 250000, currentConsumption: 6800000, assignedTo: salesNames[0] || "张伟", createdAt: d(200), lastContactAt: d(0), nextContactAt: d(14), remark: "长期合作客户，月消耗稳定在600万+", riskLevel: "低" },
    { id: generateId(), name: "数码先锋科技有限公司", shopName: "数码先锋专营店", contact: "陈总", phone: "13800001004", industry: "3C数码", clientType: "代理运营商", source: "陌拜", tier: "B", stage: "待联系", status: "新开发", budgetRange: "50-100万", dailyBudget: 30000, currentConsumption: 0, assignedTo: salesNames[2] || "王芳", createdAt: d(15), lastContactAt: null, nextContactAt: d(1), remark: "刚通过陌拜获取的线索，需要初次联系", riskLevel: "中" },
    { id: generateId(), name: "优家家居股份有限公司", shopName: "优家家居旗舰店", contact: "刘总", phone: "13800001005", industry: "家居家装", clientType: "KA大客户", source: "渠道合作", tier: "A", stage: "待约面", status: "跟进中", budgetRange: "100-500万", dailyBudget: 100000, currentConsumption: 2800000, assignedTo: salesNames[1] || "李娜", createdAt: d(60), lastContactAt: d(2), nextContactAt: d(5), remark: "已通过初步沟通，约好下周面谈", riskLevel: "低" },
    { id: generateId(), name: "宝贝母婴用品有限公司", shopName: "宝贝母婴旗舰店", contact: "周总", phone: "13800001006", industry: "母婴亲子", clientType: "品牌旗舰店", source: "转介绍", tier: "C", stage: "已演示", status: "观望评估", budgetRange: "30-50万", dailyBudget: 15000, currentConsumption: 350000, assignedTo: salesNames[2] || "王芳", createdAt: d(80), lastContactAt: d(7), nextContactAt: d(10), remark: "演示后表示需要考虑，近期预算有限", riskLevel: "高" },
    { id: generateId(), name: "璀璨珠宝有限公司", shopName: "璀璨珠宝旗舰店", contact: "林总", phone: "13800001007", industry: "珠宝饰品", clientType: "中小卖家", source: "电销", tier: "D", stage: "待联系", status: "新开发", budgetRange: "0-30万", dailyBudget: 8000, currentConsumption: 0, assignedTo: salesNames[3] || "刘洋", createdAt: d(7), lastContactAt: null, nextContactAt: d(2), remark: "小型珠宝商，想尝试抖音投放", riskLevel: "高" },
    { id: generateId(), name: "活力运动装备有限公司", shopName: "活力运动旗舰店", contact: "吴总", phone: "13800001008", industry: "运动户外", clientType: "品牌旗舰店", source: "公司派单", tier: "B", stage: "推进合作", status: "活跃投放", budgetRange: "50-100万", dailyBudget: 50000, currentConsumption: 1500000, assignedTo: salesNames[3] || "刘洋", createdAt: d(100), lastContactAt: d(1), nextContactAt: d(3), remark: "合作推进中，正在走合同流程", riskLevel: "低" },
    { id: generateId(), name: "萌宠乐园宠物用品", shopName: "萌宠乐园专营店", contact: "马总", phone: "13800001009", industry: "宠物用品", clientType: "中小卖家", source: "陌拜", tier: "C", stage: "已加微", status: "跟进中", budgetRange: "30-50万", dailyBudget: 12000, currentConsumption: 80000, assignedTo: salesNames[4] || "陈静", createdAt: d(30), lastContactAt: d(5), nextContactAt: d(8), remark: "对宠物用品类投放感兴趣，需要更多案例", riskLevel: "中" },
    { id: generateId(), name: "安康医疗科技有限公司", shopName: "安康医疗旗舰店", contact: "郑总", phone: "13800001010", industry: "医疗保健", clientType: "品牌旗舰店", source: "渠道合作", tier: "A", stage: "已成交", status: "活跃投放", budgetRange: "100-500万", dailyBudget: 120000, currentConsumption: 3200000, assignedTo: salesNames[4] || "陈静", createdAt: d(180), lastContactAt: d(0), nextContactAt: d(14), remark: "医疗类目稳定投放，ROI表现良好", riskLevel: "低" },
    { id: generateId(), name: "博学教育集团", shopName: "博学教育旗舰店", contact: "黄总", phone: "13800001011", industry: "教育培训", clientType: "KA大客户", source: "转介绍", tier: "A", stage: "已演示", status: "跟进中", budgetRange: "100-500万", dailyBudget: 90000, currentConsumption: 2000000, assignedTo: salesNames[5] || "赵磊", createdAt: d(150), lastContactAt: d(2), nextContactAt: d(4), remark: "教育行业投放政策变化，需要重新评估", riskLevel: "中" },
    { id: generateId(), name: "车友汽车配件有限公司", shopName: "车友配件专营店", contact: "杨总", phone: "13800001012", industry: "汽车配件", clientType: "中小卖家", source: "电销", tier: "D", stage: "待联系", status: "新开发", budgetRange: "0-30万", dailyBudget: 5000, currentConsumption: 0, assignedTo: salesNames[5] || "赵磊", createdAt: d(5), lastContactAt: null, nextContactAt: d(1), remark: "电销获取新线索，规模较小", riskLevel: "高" },
    { id: generateId(), name: "美颜化妆品有限公司", shopName: "美颜化妆品旗舰店", contact: "徐总", phone: "13800001013", industry: "美妆护肤", clientType: "品牌旗舰店", source: "公司派单", tier: "S", stage: "已成交", status: "活跃投放", budgetRange: "500万以上", dailyBudget: 300000, currentConsumption: 7500000, assignedTo: salesNames[0] || "张伟", createdAt: d(300), lastContactAt: d(0), nextContactAt: d(7), remark: "最大客户之一，月均消耗700万+", riskLevel: "低" },
    { id: generateId(), name: "食尚食品有限公司", shopName: "食尚食品旗舰店", contact: "孙总", phone: "13800001014", industry: "食品饮料", clientType: "中小卖家", source: "陌拜", tier: "B", stage: "已加微", status: "观望评估", budgetRange: "50-100万", dailyBudget: 25000, currentConsumption: 300000, assignedTo: salesNames[2] || "王芳", createdAt: d(45), lastContactAt: d(4), nextContactAt: d(6), remark: "观望中，对ROI有疑虑", riskLevel: "中" },
];
}

export function generateSeedAdvertisers(leads) {
  const activeClients = leads.filter(l => l.stage === "已成交" || l.status === "活跃投放");
  return activeClients.map((lead, i) => ({
    id: generateId(),
    leadId: lead.id,
    name: lead.name,
    shopName: lead.shopName || lead.name + "旗舰店",
    industry: lead.industry,
    contact: lead.contact,
    phone: lead.phone,
    assignedTo: lead.assignedTo,
    startDate: new Date(Date.now() - (i + 3) * 30 * 86400000).toISOString().slice(0, 10),
    mainProduct: ["护肤套装", "休闲服装", "零食礼盒", "手机配件", "家居装饰", "早教玩具", "珠宝首饰", "运动鞋", "猫粮狗粮", "保健食品", "在线课程", "车载配件", "面膜套装", "速食面"][i % 14],
    unitPrice: [299, 159, 68, 49, 399, 128, 899, 299, 79, 198, 999, 88, 199, 39][i % 14],
    rebate: [12, 10, 8, 15, 11, 9, 13, 10, 7, 14, 12, 8, 11, 6][i % 14],
    riskLevel: ["低","低","中","低","低","中","高","低","中","低","中","高","低","低"][i % 14],
    metrics: generateMetrics(i),
  }));
}

function generateMetrics(seed) {
  const metrics = [];
  for (let i = 0; i < 30; i++) {
    const cpm = 25 + (seed * 7 + i * 3) % 40;
    const ctr = (1.5 + (seed * 0.3 + i * 0.05) % 2.5).toFixed(2);
    const cvr = (1.0 + (seed * 0.2 + i * 0.03) % 2.5).toFixed(2);
    const roi = (1.2 + (seed * 0.15 + i * 0.02) % 2.0).toFixed(2);
    metrics.push({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      dailyConsumption: Math.floor(5000 + (seed + i) * 3000 + Math.random() * 10000),
      cpm: Math.round(cpm * 10) / 10,
      ctr: parseFloat(ctr),
      cvr: parseFloat(cvr),
      roi: parseFloat(roi),
    });
  }
  return metrics;
}
