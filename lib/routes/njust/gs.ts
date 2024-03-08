import { Route } from '@/types';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';
import { getContent } from './utils';

const host = 'https://gs.njust.edu.cn';

export const route: Route = {
    path: '/gs/:type?',
    categories: ['forecast'],
    example: '/njust/gs/sytzgg_4568',
    parameters: { type: '分类 ID，部分示例参数见下表，默认为首页通知公告，其他分类 ID 可以从网站 URL Path 中找到，如国际交流为 `gjjl`' },
    features: {
        requireConfig: false,
        requirePuppeteer: true,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: {
        source: ['gs.njust.edu.cn/:type/list.htm'],
        target: '/gs/:type',
    },
    name: '研究生院',
    maintainers: ['MilkShakeYoung', 'jasongzy'],
    handler,
};

async function handler(ctx) {
    const type = ctx.req.param('type') ?? 'sytzgg_4568';
    const id = '/' + type;
    const siteUrl = host + id + '/list.htm';

    const html = await getContent(siteUrl);
    const $ = load(html);
    const title = '南京理工大学研究生院 -- ' + $('title').text();
    const list = $('ul.news_ul').find('li');

    const items = await Promise.all(
        list.map(async (index, item) => {
            const url = $(item).find('a').attr('href');
            let desc = '';
            if (url.startsWith('/')) {
                const data = await getContent(host + url);
                desc = load(data)('.wp_articlecontent').html();
            }

            return {
                title: $(item).find('a').attr('title').trim(),
                description: desc,
                pubDate: timezone(parseDate($(item).find('span').text(), 'YYYY-MM-DD'), +8),
                link: url,
            };
        })
    );

    return {
        title,
        link: siteUrl,
        item: items,
    };
}
