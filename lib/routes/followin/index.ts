import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { apiUrl, favicon, getBParam, getBuildId, getGToken, parseList, parseItem } from './utils';

export const route: Route = {
    path: '/:categoryId?/:lang?',
    categories: ['other'],
    example: '/followin',
    parameters: { categoryId: 'Category ID, see table below, `1` by default', lang: 'Language, see table below, `en` by default' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Home',
    maintainers: ['TonyRL'],
    handler,
};

async function handler(ctx) {
    const { categoryId = '1', lang = 'en' } = ctx.req.param();
    const { limit = 20 } = ctx.req.query();
    const gToken = await getGToken(cache.tryGet);
    const bParam = getBParam(lang);

    const { data: response } = await got.post(`${apiUrl}/feed/list/recommended`, {
        headers: {
            'x-bparam': JSON.stringify(bParam),
            'x-gtoken': gToken,
        },
        json: {
            category_id: Number.parseInt(categoryId),
            count: Number.parseInt(limit),
        },
    });
    if (response.code !== 2000) {
        throw new Error(response.msg);
    }

    const buildId = await getBuildId(cache.tryGet);

    const list = parseList(response.data.list, lang, buildId);
    const items = await Promise.all(list.map((item) => parseItem(item, cache.tryGet)));

    return {
        title: 'Followin',
        link: 'https://followin.io',
        image: favicon,
        item: items,
    };
}
