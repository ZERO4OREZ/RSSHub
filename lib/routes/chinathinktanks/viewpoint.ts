import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate, parseRelativeDate } from '@/utils/parse-date';
import timezone from '@/utils/timezone';
import { CookieJar } from 'tough-cookie';

const cookieJar = new CookieJar();
const baseUrl = 'https://www.chinathinktanks.org.cn';

export const route: Route = {
    path: '/:id',
    categories: ['journal'],
    example: '/chinathinktanks/57',
    parameters: { id: '见下表，亦可在网站 url 里找到' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '观点与实践',
    maintainers: ['Aeliu'],
    handler,
};

async function handler(ctx) {
    const link = `https://www.chinathinktanks.org.cn/content/list?id=${ctx.req.param('id')}&pt=1`;

    const response = await got(link, {
        cookieJar,
    });
    const $ = load(response.data);

    let items = $('.main-content-left-list-item')
        .toArray()
        .map((e) => {
            e = $(e);
            return {
                title: e.find('.title span').text(),
                link: baseUrl + e.attr('href'),
                author: e.find('.author-by span').text(),
                pubDate: e.find('.author-time').text(),
            };
        });

    items = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await got({
                    url: item.link,
                    cookieJar,
                });
                const $ = load(response.data);
                const content = $('#art');
                item.description = content.html();
                item.pubDate = item.pubDate.includes('-') ? timezone(parseDate(item.pubDate, 'YYYY-MM-DD'), +8) : parseRelativeDate(item.pubDate);

                return item;
            })
        )
    );

    return {
        title: `中国智库网 —— ${$('title').text().split('_中国智库网')[0]}`,
        link,
        item: items,
    };
}
