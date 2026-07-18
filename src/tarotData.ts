import type { CardOrientation, DrawnCard, Suit, TarotCard } from "./types";

const majorCards: TarotCard[] = [
  card("major-00", "愚者", "major", ["启程", "自由", "信任"], "新的旅程正在打开，直觉比计划更早知道方向。", "冲动或逃避现实会让机会变成消耗。", "你站在门槛上，轻装前进比反复犹豫更重要。"),
  card("major-01", "魔术师", "major", ["意志", "创造", "显化"], "资源已经到位，行动会把想法转成现实。", "能力分散或动机不清，容易把能量用错地方。", "把注意力集中在一个清晰目标上，世界会开始回应。"),
  card("major-02", "女祭司", "major", ["直觉", "秘密", "静观"], "答案藏在安静处，先观察再行动。", "你可能忽略了内在提醒，或被表象带走。", "放慢速度，未说出口的信息正在浮现。"),
  card("major-03", "女皇", "major", ["滋养", "丰盛", "生长"], "关系、创作或资源进入生长期。", "过度付出会耗尽自己，也会让边界模糊。", "照顾好土壤，结果会自然长出来。"),
  card("major-04", "皇帝", "major", ["结构", "秩序", "掌控"], "需要建立规则、边界和稳定执行。", "僵硬控制会压住真正的生命力。", "把混乱整理成系统，你会重新拿回主导权。"),
  card("major-05", "教皇", "major", ["传统", "学习", "信念"], "向成熟经验、导师或体系借力。", "盲从规则会让你失去自己的判断。", "理解规则之后，再决定哪些值得继承。"),
  card("major-06", "恋人", "major", ["选择", "连结", "价值"], "重要选择需要与真实价值观一致。", "逃避选择会让关系或局势停在暧昧里。", "诚实地选择，你也会看见自己真正想守护什么。"),
  card("major-07", "战车", "major", ["推进", "胜利", "纪律"], "目标明确时，持续推进会带来突破。", "方向不稳或情绪失控会削弱进展。", "把力量绑在同一个方向，速度就会出现。"),
  card("major-08", "力量", "major", ["勇气", "温柔", "驯服"], "温柔的坚持比强硬对抗更有效。", "压抑情绪或逞强会制造反弹。", "真正的力量，是能靠近恐惧但不被它带走。"),
  card("major-09", "隐士", "major", ["沉思", "寻找", "智慧"], "暂时远离噪声，可以找到更深答案。", "孤立太久会把清醒变成退缩。", "你需要一盏自己的灯，而不是更多掌声。"),
  card("major-10", "命运之轮", "major", ["转折", "周期", "机会"], "局势正在转动，把握变化里的窗口。", "抗拒变化会让你错过新的节奏。", "别试图固定风向，调整帆面更有用。"),
  card("major-11", "正义", "major", ["平衡", "因果", "判断"], "事实、责任和公平需要被摆到台面上。", "偏见或回避责任会带来后续代价。", "清楚地看见因果，选择会变得简单。"),
  card("major-12", "倒吊人", "major", ["暂停", "换位", "牺牲"], "暂停不是失败，而是视角正在重组。", "长期停滞可能来自不愿做决定。", "换一个角度，原本卡住的事会露出入口。"),
  card("major-13", "死神", "major", ["结束", "蜕变", "释放"], "旧阶段正在结束，为新生命腾出空间。", "抓住该结束的事，会让更新变得痛苦。", "放手不是失去，而是让能量回到未来。"),
  card("major-14", "节制", "major", ["调和", "疗愈", "流动"], "不同元素可以被温和地整合。", "失衡来自过度、急躁或无法妥协。", "慢慢调配，答案会在中间地带成形。"),
  card("major-15", "恶魔", "major", ["束缚", "欲望", "阴影"], "看清依赖和执念，是解开它们的开始。", "否认欲望会让它在暗处控制你。", "你并非没有选择，只是需要先承认锁链在哪里。"),
  card("major-16", "高塔", "major", ["崩塌", "觉醒", "重建"], "虚假的结构被打破，真相会带来释放。", "拖延改变只会让冲击更剧烈。", "倒塌之处，也是空气第一次进来的地方。"),
  card("major-17", "星星", "major", ["希望", "灵感", "复原"], "信念回来了，未来开始重新发光。", "希望若脱离行动，容易变成空想。", "把自己交还给辽阔，下一步会更轻。"),
  card("major-18", "月亮", "major", ["迷雾", "潜意识", "梦境"], "直觉敏锐，但信息还不够清晰。", "恐惧可能被想象放大，需要验证。", "别急着定义真相，先穿过迷雾。"),
  card("major-19", "太阳", "major", ["喜悦", "成功", "清晰"], "事情进入明朗、开放和被看见的阶段。", "过度乐观可能忽略细节。", "让真实的光照进来，答案会变得坦荡。"),
  card("major-20", "审判", "major", ["召唤", "觉醒", "复盘"], "过去的经验正在召唤你进入新阶段。", "自责或逃避复盘会让旧课题重演。", "听见内在的召唤，然后回应它。"),
  card("major-21", "世界", "major", ["完成", "整合", "抵达"], "一个阶段圆满完成，整合带来更大自由。", "临门一脚的松散会影响收尾质量。", "庆祝抵达，也准备好走向更大的循环。")
];

const suitProfiles: Record<Suit, { zh: string; theme: string; keywords: string[] }> = {
  wands: { zh: "权杖", theme: "行动、热情与创造力", keywords: ["行动", "热情", "创造"] },
  cups: { zh: "圣杯", theme: "情感、关系与直觉", keywords: ["情感", "关系", "直觉"] },
  swords: { zh: "宝剑", theme: "思想、沟通与决断", keywords: ["思考", "沟通", "决断"] },
  pentacles: { zh: "星币", theme: "资源、身体与现实成果", keywords: ["资源", "稳定", "成果"] }
};

const ranks = [
  ["ace", "一", "种子", "新的能量开始凝聚"],
  ["two", "二", "平衡", "两个方向需要协调"],
  ["three", "三", "扩展", "合作与成长正在出现"],
  ["four", "四", "稳定", "结构和安全感成为重点"],
  ["five", "五", "冲突", "摩擦推动你重新选择"],
  ["six", "六", "流动", "支持与回馈开始循环"],
  ["seven", "七", "挑战", "需要策略和耐心"],
  ["eight", "八", "推进", "节奏加快，行动变密"],
  ["nine", "九", "成熟", "接近完成，也需要守住能量"],
  ["ten", "十", "完成", "一个周期抵达结果"],
  ["page", "侍从", "探索", "以学习者姿态接近新领域"],
  ["knight", "骑士", "追求", "能量强烈地奔向目标"],
  ["queen", "皇后", "承载", "成熟地滋养与管理能量"],
  ["king", "国王", "掌握", "以清醒意志领导局面"]
] as const;

const minorCards = (Object.keys(suitProfiles) as Suit[]).flatMap((suit) => {
  const profile = suitProfiles[suit];
  return ranks.map(([rankId, rankName, rankKeyword, rankMeaning]) =>
    card(
      `minor-${suit}-${rankId}`,
      `${profile.zh}${rankName}`,
      "minor",
      [rankKeyword, ...profile.keywords],
      `${profile.theme}在此刻被点亮；${rankMeaning}，适合顺势推进。`,
      `${profile.theme}出现阻滞；先处理失衡，再谈结果。`,
      `这张牌提醒你把${profile.theme}落到具体行动里。`,
      suit,
      rankName
    )
  );
});

export const tarotDeck: TarotCard[] = [...majorCards, ...minorCards];

export function drawCard(index: number): DrawnCard {
  const cardIndex = ((index % tarotDeck.length) + tarotDeck.length) % tarotDeck.length;
  return {
    card: tarotDeck[cardIndex],
    orientation: Math.random() > 0.5 ? "upright" : "reversed"
  };
}

export function orientationLabel(orientation: CardOrientation): string {
  return orientation === "upright" ? "正位" : "逆位";
}

function card(
  id: string,
  name: string,
  arcana: TarotCard["arcana"],
  keywords: string[],
  uprightMeaning: string,
  reversedMeaning: string,
  shortInterpretation: string,
  suit?: Suit,
  number?: string
): TarotCard {
  return {
    id,
    name,
    arcana,
    suit,
    number,
    keywords,
    uprightMeaning,
    reversedMeaning,
    shortInterpretation
  };
}
