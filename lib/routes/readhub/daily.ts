import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';

import { rootUrl, processItems } from './util';

export const route: Route = {
    path: '/daily',
    categories: ['traditional-media'],
    example: '/readhub/daily',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: {
        source: ['readhub.cn/daily'],
    },
    name: '每日早报',
    maintainers: ['nczitzk'],
    handler,
};

async function handler(ctx) {
    const limit = ctx.req.query('limit') ? Number.parseInt(ctx.req.query('limit'), 10) : 11;

    const currentUrl = new URL('daily', rootUrl).href;

    const { data: currentResponse } = await got(currentUrl);

    const dailyItems = JSON.parse(currentResponse.match(/{\\"daily\\":(.*?),\\"ts\\":\d+/)[1].replaceAll('\\"', '"'));

    let items = dailyItems.slice(0, limit).map((item) => ({
        title: item.title,
        link: new URL(`topic/${item.uid}`, rootUrl).href,
        guid: item.uid,
    }));

    items = await processItems(items, cache.tryGet);

    const $ = load(currentResponse);

    const author = $('meta[name="application-name"]').prop('content');
    const subtitle = $('meta[property="og:title"]').prop('content');
    const image = 'https://readhub-oss.nocode.com/static/readhub.png';
    const icon = new URL($('link[rel="apple-touch-icon"]').prop('href'), rootUrl);

    return {
        item: items,
        title: `${author} - ${subtitle}`,
        link: currentUrl,
        description: $('meta[name="description"]').prop('content'),
        language: 'zh',
        image,
        icon,
        logo: icon,
        subtitle,
        author,
        allowEmpty: true,
    };
}
