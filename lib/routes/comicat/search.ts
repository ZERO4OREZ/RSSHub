import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

const baseUrl = 'https://comicat.org';

export const route: Route = {
    path: '/search/:keyword',
    categories: ['program-update'],
    example: '/comicat/search/喵萌奶茶屋+跃动青春+720P+简日',
    parameters: { keyword: '关键词，请用`+`号连接' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: true,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '搜索关键词',
    maintainers: ['Cyang39'],
    handler,
};

async function handler(ctx) {
    const keyword = ctx.req.param('keyword');
    const { data: response } = await got(`${baseUrl}/search.php?keyword=${encodeURIComponent(keyword)}`);
    const $ = load(response);
    const list = $('#listTable tbody > tr')
        .toArray()
        .map((item) => ({
            title: $(item).find('td:nth-child(3)').text().trim(),
            link: `${baseUrl}/${$(item).find('td:nth-child(3) a').attr('href')}`,
            category: $(item).find('td:nth-child(2)').text().trim(),
            author: $(item).find('td:nth-child(8)').text().trim(),
        }));

    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = load(response);

                item.pubDate = parseDate($('div.main > div.slayout > div > div.c1 > div:nth-child(1) > div > p:nth-child(4)').text().split('发布时间: ')[1]);
                const marginLink = `magnet:?xt=urn:btih:${$('#text_hash_id').text().split('，特征码：')[1]}`.trim();
                item.enclosure_url = marginLink;
                item.enclosure_type = 'application/x-bittorrent';
                item.description = $('#btm > div.main > div.slayout > div > div.c2 > div:nth-child(1) > div.intro').html();

                return item;
            })
        )
    );

    return {
        title: `Comicat - ${keyword}`,
        link: `${baseUrl}/search.php?keyword=${encodeURIComponent(keyword)}`,
        item: items,
    };
}
