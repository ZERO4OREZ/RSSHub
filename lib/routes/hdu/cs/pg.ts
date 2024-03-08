import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

const link = 'https://computer.hdu.edu.cn';
const host = 'https://computer.hdu.edu.cn/6769/list.htm';

const getSingleRecord = async () => {
    const res = await got(host);

    const $ = load(res.data);
    const list = $('.posts-list').find('li');

    return (
        list &&
        list
            .map((index, item) => {
                item = $(item);
                const dateTxt = item.find('.date').text();
                const date = dateTxt.slice(1, -1);
                return {
                    title: item.find('a').text(),
                    pubDate: parseDate(date),
                    link: link + item.find('a').attr('href'),
                };
            })
            .get()
    );
};

export const route: Route = {
    path: '/cs/pg',
    categories: ['forecast'],
    example: '/hdu/cs/pg',
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
        source: ['computer.hdu.edu.cn/6769/list.htm'],
    },
    name: '计算机学院 - 研究生通知',
    maintainers: ['legr4ndk'],
    handler,
};

async function handler() {
    const items = await getSingleRecord();
    const out = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await got(item.link);
                const $ = load(response.data);
                return {
                    title: item.title,
                    link: item.link,
                    description: $('.wp_articlecontent').html(),
                    pubDate: item.pubDate,
                };
            })
        )
    );

    return {
        title: '杭电计算机-研究生通知',
        description: '杭州电子科技大学计算机学院-研究生教学通知',
        link: host,
        item: out,
    };
}
