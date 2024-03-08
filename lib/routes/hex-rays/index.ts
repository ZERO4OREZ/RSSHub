import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/news',
    categories: ['design'],
    example: '/hex-rays/news',
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
        source: ['hex-rays.com/', 'hex-rays.com/blog'],
    },
    name: 'Hex-Rays News',
    maintainers: ['hellodword ', 'TonyRL'],
    handler,
};

async function handler() {
    const link = 'https://www.hex-rays.com/blog/';
    const response = await got.get(link);
    const $ = load(response.data);

    const list = $('.post-list-container')
        .map((_, ele) => ({
            title: $('h3 > a', ele).text(),
            link: $('h3 > a', ele).attr('href'),
            pubDate: parseDate($('.post-meta:nth-of-type(1)', ele).first().text().trim().replace('Posted on:', '')),
            author: $('.post-meta:nth-of-type(2)', ele).first().text().replace('By:', '').trim(),
        }))
        .get();

    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const detailResponse = await got.get(item.link);
                const content = load(detailResponse.data);

                item.category = (
                    content('.category-link')
                        .toArray()
                        .map((e) => $(e).text()) +
                    ',' +
                    content('.tag-link')
                        .toArray()
                        .map((e) => $(e).text())
                ).split(',');

                item.description = content('.post-content').html();

                return item;
            })
        )
    );

    return {
        title: 'Hex-Rays Blog',
        link,
        item: items,
    };
}
