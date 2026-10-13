/**
 * 首页「今日原文」与「换一句」的**唯一供给**（2026-10-06 定，见 TASK.md §3.40）。
 *
 * 为什么不再直接用检索结果：实测（见 DEV.md 2026-10-06 两条）首页原先那个「换一句」的池子
 * 是关键词检索命中，其中约三分之二是雪球回帖里的**应答句**（例如「你如果做“价值投资”很赚钱的话，
 * 你为什么想转？」），离开原问题就不成立；机械规则（完整句 / 非接话头 / 非指代 / qa_role=statement）
 * 最多只能砍掉两成，救不回来。结论是**供给**的问题，不是排序或随机的问题：
 * 一段原文可以被搜到，不等于它适合被主动推到首页。
 *
 * 这份清单怎么来的：tools/build-hero-list.mjs 用七个种子词各取 50 条候选 → 逐条打开上下文
 * 人工核对（能否独立成立、是否只列名词或附和、单独展示是否改变原意）→ 把通过的记录**原样**落成
 * 本文件。原文逐字来自接口快照，未改写、未补主语、未缩写；日期与出处沿用真实元信息。
 *
 * 维护：这是**快照**，不是流水线。不自动扩充、不实时补池 —— 这里没有第几条，就没有第几条。
 * 所引记录若被修正 / 删除 / 定位失效，对应条目要同步修正或移除；
 * tests/hero-quotes.test.js 守住字段完整、长度窗口、无近似重复这几条底线。
 */
module.exports = [
  {
    "passage_id": "28ae75f9-173b-5ca0-9d18-297769d1fe43",
    "doc_id": "537870ba-375f-5631-9c23-ff8dc8e0a9e3",
    "segment_id": "3c3c3866-59dd-572e-947a-f01df16a4d4a",
    "text": "我们说本分时说的是“求则于己”，而不是把“本分”作为照妖镜用的。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "【转载】2017年巴菲特致股东的信",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2017-05-10",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201741082936182"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "本分"
  },
  {
    "passage_id": "4709ac78-42af-5dd3-bf6f-7ef991b12ad1",
    "doc_id": "472d407d-9f1c-51d3-a6fb-95d68784ed2c",
    "segment_id": "081705e2-acde-5c7b-af90-46f2cd976ecc",
    "text": "平常心实际上就是不平常心，对谁都不是件容易的事。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "本分和平常心（1）",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2010-03-24",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/126998120102244121787/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "平常心"
  },
  {
    "passage_id": "1673f85a-b49e-53c4-b3b6-155a97c2eb43",
    "doc_id": "5f5acde7-8441-5335-8bdf-8bf900945d7d",
    "segment_id": "c2801d36-6ccd-524f-bcff-2bfb324d07a4",
    "text": "做对的事情的过程当中是会犯很多错误的，这个过程叫学习。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "做对的事情的过程当中是会犯很多错误的，这个过程叫学习。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2025-10-29",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/358695964"
    },
    "qa_role": "statement",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "做对的事情"
  },
  {
    "passage_id": "cfec114c-30fd-512a-94a6-bfa0be2724ae",
    "doc_id": "d2e57adb-c39c-5b0d-a58d-e169f21d2bfa",
    "segment_id": "12dc122e-b208-500a-aa47-5ea771148568",
    "text": "很难判断一个企业文化是否好，但看出不好的企业文化要容易的多。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "网易ntes、搜狐sohu、畅游cyou、完美世界pwrd、巨人ga",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2010-07-09",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/12699812010693153476/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  },
  {
    "passage_id": "692b85ae-1592-5fdd-b3af-c7e66c405e47",
    "doc_id": "a138523b-4119-50c7-8498-3f0fbfc58b59",
    "segment_id": "44da2bb0-7d7e-5368-990d-b1e7b6b395d6",
    "text": "只想说一点：＂长期投资＂并不自动等于价值投资，但价值投资一般都是长期投资。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "只想说一点：＂长期投资＂并不自动等于价值投资，但价值投资一般都是长期投资。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2012-03-14",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/21568406"
    },
    "qa_role": "statement",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "价值投资"
  },
  {
    "passage_id": "b28787fc-9ebe-5994-bc48-ed4ceb212be1",
    "doc_id": "ea2a5fa6-54ac-5e4d-8f03-a283b9981f8a",
    "segment_id": "6baf98df-660e-58a8-8953-0b4ccfc2fc24",
    "text": "很多人认为长期主义太难，但长期主义却是最容易的办法。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "很多人认为长期主义太难，但长期主义却是最容易的办法。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2024-01-07",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/273836900"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "长期主义"
  },
  {
    "passage_id": "955e17d6-15c8-5105-b610-a5944ae17bfa",
    "doc_id": "a8b6a851-5838-5b7a-8e7e-a83710b5f421",
    "segment_id": "475f089f-2db6-5f73-bec2-158addcb58b8",
    "text": "本分是骨子里的东西，应该不是学来的。比如借钱要还等等。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "在浙大给毕业生的讲话",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2016-06-12",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201651243949960/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "本分"
  },
  {
    "passage_id": "d923da03-779a-5f87-a1ad-6e1cffbe09d3",
    "doc_id": "afa32d20-9571-54bb-b1ec-87f22a5b41ba",
    "segment_id": "0a3beb7f-db99-50b1-80a8-7bfbe230b6c8",
    "text": "愤怒一下，然后平常心回归本源，该干嘛干嘛，不要因为愤怒做出任何决定。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "愤怒一下，然后平常心回归本源，该干嘛干嘛，不要因为愤怒做出任何决定。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2018-10-11",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/114891439"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "平常心"
  },
  {
    "passage_id": "f5c92632-069e-552a-86d8-f615584409d3",
    "doc_id": "e6b694b1-8aa5-5b80-9f9d-6b5d2a402ffe",
    "segment_id": "1229442e-c922-5eba-b998-5f36e0edb83e",
    "text": "欲速不达指的是要做对的事情，快指的是把事情做对的效率。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "引用 段永平谈“经营、投资与公益”（20）",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2014-06-06",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/126998120145611547575/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "做对的事情"
  },
  {
    "passage_id": "7182cda5-ed21-554a-997d-93fce2538255",
    "doc_id": "3c8c1130-e6ae-5ef9-81dc-c2201c3c21e5",
    "segment_id": "26093b76-356b-5df2-b6be-37ad43672d02",
    "text": "简而言之，好的企业文化可以让企业少犯原则性错误，从而可以走得更远。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "不知道谁写的，值得一看---宝洁是我喜欢的公司之一",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2010-07-07",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/126998120106715150143/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  },
  {
    "passage_id": "65ce3fe5-d7dd-597e-9526-f823563a7f19",
    "doc_id": "d85046b6-419c-50f5-9ee5-e2539788f2e2",
    "segment_id": "7fdaf7d9-0b93-5d33-93f3-ec25d6dd45cb",
    "text": "人们往往都说“价值投资”很难，所以他们往往都选择了更难的办法。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "人们往往都说“价值投资”很难，所以他们往往都选择了更难的办法。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2025-10-26",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/358240573"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "价值投资"
  },
  {
    "passage_id": "cbd5c4b1-59e7-54a6-abea-3bb18a507dff",
    "doc_id": "31f685d9-a8aa-5c93-b6ee-f92e1989665e",
    "segment_id": "ec0159e9-fe6e-5e5a-9b89-cdb5dcc147b2",
    "text": "不是因为长期主义难，而是因为大多数人都很不理性地贪心，想赚快钱，结果就是绝大多数人都亏钱。长期主义其实非常简单，就是偶尔看一下，平时该打球打球，该干嘛干嘛。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "不是因为长期主义难，而是因为大多数人都很不理性地贪心，想赚快钱，结果就是绝大多数",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2024-01-08",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/273899876"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "长期主义"
  },
  {
    "passage_id": "ba09f154-4bd9-51b7-bd99-8f058fc23241",
    "doc_id": "1c36af5a-ae61-5db9-9edb-9b0b700895da",
    "segment_id": "dc58a27b-e24f-5b4a-9024-2002595b139d",
    "text": "我的理解，我们的本分指的就是原点，平常心就是回到原点思考的心态。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "2013年9月21日",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2013-09-21",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201382125153718/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "本分"
  },
  {
    "passage_id": "75aa553c-ea24-5dc6-a53a-fbd33a4d9487",
    "doc_id": "3be5d35a-c643-5dbe-ae00-86d9d8cda57c",
    "segment_id": "1ea9a9e4-030a-50d7-9985-e1cc83471aa5",
    "text": "平常心其实就是理性思考的习惯，应该是后天养成的。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "平常心其实就是理性思考的习惯，应该是后天养成的。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2019-04-22",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/125356435"
    },
    "qa_role": "statement",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "平常心"
  },
  {
    "passage_id": "bfa6572e-ae2e-5bd6-a15a-28d773f45ce4",
    "doc_id": "2510ed94-aab7-52e9-802b-b2e3e17b4901",
    "segment_id": "7067ecf1-e8bf-5b62-ae73-dfbdf4a4029a",
    "text": "道就是“做对的事情和把事情做对”，就是理性想长远想本质。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "道就是“做对的事情和把事情做对”，就是理性想长远想本质。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2025-07-24",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/343861522"
    },
    "qa_role": "statement",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "做对的事情"
  },
  {
    "passage_id": "ef008914-5e05-5bd1-baa7-1be52764cef2",
    "doc_id": "7aad3fd4-41d1-58f9-a8de-9c6769eeab84",
    "segment_id": "10bcdc12-83c2-5059-8b7e-c8daea162ef6",
    "text": "我不会只是基于企业文化买公司，但会把有好的企业文化作为想买的前提之一。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "“It’s about finding your values, and committing to them. It’s about finding your North Star.",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2015-05-19",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201541974041722/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  },
  {
    "passage_id": "5fcef999-5412-5033-8a24-19b8420169e0",
    "doc_id": "b963b34f-d75f-50fc-9214-06f490678dec",
    "segment_id": "b4ac031e-e6a0-5f59-982a-f0d34c9d3386",
    "text": "价值投资就是长期投资（从长期来看一个企业），但长期投资不一定是价值投资（死抱一只股票）。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "有趣的文章",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2010-11-30",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201010300730382/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "价值投资"
  },
  {
    "passage_id": "44cf5503-a344-5a7b-919a-4708e51ad46b",
    "doc_id": "10676fca-2572-56e9-b373-177de8599aec",
    "segment_id": "76037941-d8be-5721-b331-d1da71c54da5",
    "text": "本分简单讲就是做该做的事情，进一步说其实就是不该做的事情不要做。其实这说的也是stop list。理性思考其实也是这个意思，想长远也是。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "本分简单讲就是做该做的事情，进一步说其实就是不该做的事情不要做。其实这说的也是s",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2026-07-19",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/400963984"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "本分"
  },
  {
    "passage_id": "34ca9c64-81fe-5a61-8bf2-296ba98cf28a",
    "doc_id": "8cae7b31-4022-5489-a39d-b4161baba4e6",
    "segment_id": "211462dd-40f4-5c83-90da-379eaf0e13c7",
    "text": "平常心：平常心其实就是在任何时候，尤其是在有诱惑的时候，能够排除所有外界的干扰，回到事物的本质（原点），辨别事情的是非与对错，知道什么是对的事情。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "平常心：平常心其实就是在任何时候，尤其是在有诱惑的时候，能够排除所有外界的干扰，",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2019-09-12",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/132715804"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "平常心"
  },
  {
    "passage_id": "3076107d-5ba8-57bd-9812-837ed821c84e",
    "doc_id": "935fef4d-a183-57ab-a69a-ba240903328a",
    "segment_id": "75b039f2-ee31-540c-a3f4-7d5cf579e911",
    "text": "一般来讲，聪明人知道如何把事情做对，但有智慧指的是要做对的事情。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "聪明和智慧的区别",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2015-08-10",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/126998120157106234914/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "做对的事情"
  },
  {
    "passage_id": "d144d955-14af-5a1b-85cf-0fde37f5aabd",
    "doc_id": "02106cfc-debe-5800-ae2b-808b11c60f3c",
    "segment_id": "bba9b6f9-9636-5713-bda3-d74c937b2a0a",
    "text": "企业文化指的就是“企业”的文化，企业文化可以来源于“个人”但不会止于个人。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "Apple Watch 使用几日感受",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2015-04-30",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201533011517680/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  },
  {
    "passage_id": "61caac1e-55fa-542f-a484-b1ea833060d2",
    "doc_id": "7cc07fcf-cf80-524c-bb26-32be5b442152",
    "segment_id": "fba99573-0ebd-5322-8041-28dbb0c7a083",
    "text": "知难行易和知易行难其实不矛盾，一个说的是要做对的事情，一个说的是把事情做对。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "价值投资难吗？",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2011-09-04",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/12699812011841267495/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "做对的事情"
  },
  {
    "passage_id": "926e069a-97ed-5277-9f52-62c6afc4cc07",
    "doc_id": "1102c17c-ba3a-5d50-8345-a8b51b224a17",
    "segment_id": "0b67c510-8da1-5b92-9612-7336a3edff83",
    "text": "没有好的企业文化很难维持，但有好的企业文化也未必就一定能维持住的，因为也可能会有战略错误导致企业完蛋的，尤其是小企业。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "再说苹果--又见3字头。",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2013-04-20",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201332042219652/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  },
  {
    "passage_id": "c029cd16-affd-5348-924e-c9af779e802e",
    "doc_id": "b15bbb0e-c411-50ea-88a2-13d76bbe5cc8",
    "segment_id": "317ea435-7407-5fba-a6e2-be0f367ba312",
    "text": "做对的事情过程中犯的错和做错的事情导致的错误结果是完全不同性质的。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "做对的事情过程中犯的错和做错的事情导致的错误结果是完全不同性质的。",
      "source_type": "xueqiu",
      "source_tier": "primary",
      "date_label": "2022-08-20",
      "date_basis": "post_created_at",
      "original_url": "https://xueqiu.com/1247347556/228583057"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "做对的事情"
  },
  {
    "passage_id": "969677a2-ac98-5f86-8403-0cb95412cc08",
    "doc_id": "02d48e35-c1c7-5f95-a965-813bed8dcaff",
    "segment_id": "6920d1cd-eeea-55d5-82c8-050b07330d3e",
    "text": "所谓的“企业文化好”并不是百战百胜的武器，他只是能让企业少犯原则性错误而已。或者说，在同一个行业里，平均而言企业文化好的企业活的长些而已。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "我们的平台着火了(转）",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2011-02-10",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201111013156335/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  },
  {
    "passage_id": "17522630-4c25-55e5-8029-fa4154944938",
    "doc_id": "216b0824-947e-5e8d-8c0b-328bc59e0e95",
    "segment_id": "17af9594-69a4-57c4-a2bc-e07324e2f161",
    "text": "做对的事情必须要贯彻到每个细胞，尤其是知道错的事情不去做，发现错了要马上改。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "500亿的猜想",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2010-02-09",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/12699812010194626715/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "做对的事情"
  },
  {
    "passage_id": "f8f05fcf-c9c1-50bd-980c-77a4a2d0caf2",
    "doc_id": "176da4d9-bfdf-54b6-bb62-ae8d0dae5aab",
    "segment_id": "42bf2ceb-2ec9-5282-92c9-12c2cf5d28bf",
    "text": "所谓企业文化讲的就是什么是对的事情（或者说哪些是不对的事情），以及如何把对的事情做对。苹果的企业文化堪称好的企业文化的经典，多看看苹果的发布会或许能有所悟。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "2015年3月21日",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2015-03-21",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/1269981201522102927468/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  },
  {
    "passage_id": "7bfbed31-42aa-505c-93ea-e4f3b0057bdd",
    "doc_id": "3854b2ea-e300-582c-9844-b5b44538937e",
    "segment_id": "b5e6b327-19f6-5226-b184-0436c31828ed",
    "text": "一般而言，创始人对企业文化的形成起的作用都很大。",
    "speaker": {
      "person_id": "duan_yongping",
      "label": "段永平"
    },
    "source": {
      "title": "调查称国产手机大多设收费陷阱 可自动扣话费",
      "source_type": "netease_blog",
      "source_tier": "primary",
      "date_label": "2010-05-09",
      "date_basis": "blog_published",
      "original_url": "http://nteswjq.blog.163.com/blog/static/126998120104911113442/"
    },
    "qa_role": "answer",
    "match_kind": "literal",
    "warnings": [],
    "is_continuation": false,
    "node": "企业文化"
  }
];
