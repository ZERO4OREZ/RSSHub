import { Route } from '@/types';
import got from '@/utils/got';
import cache from './cache';
import { config } from '@/config';

export const route: Route = {
    path: '/manga/followings/:uid/:limits?',
    categories: ['new-media'],
    example: '/bilibili/manga/followings/26009',
    parameters: { uid: '用户 id', limits: '抓取最近更新前多少本漫画，默认为10' },
    features: {
        requireConfig: true,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '用户追漫更新',
    maintainers: ['yindaheng98'],
    handler,
    description: `:::warning
  用户追漫需要 b 站登录后的 Cookie 值，所以只能自建，详情见部署页面的配置模块。
  :::`,
};

async function handler(ctx) {
    const uid = String(ctx.req.param('uid'));
    const name = await cache.getUsernameFromUID(uid);

    const cookie = config.bilibili.cookies[uid];
    if (cookie === undefined) {
        throw new Error('缺少对应 uid 的 Bilibili 用户登录后的 Cookie 值');
    }
    const page_size = ctx.req.param('limits') || 10;
    const link = 'https://manga.bilibili.com/account-center';
    const response = await got({
        method: 'POST',
        url: `https://manga.bilibili.com/twirp/bookshelf.v1.Bookshelf/ListFavorite?device=pc&platform=web`,
        json: { page_num: 1, page_size, order: 2, wait_free: 0 },
        headers: {
            Referer: link,
            Cookie: cookie,
        },
    });
    if (response.data.code === -6) {
        throw new Error('对应 uid 的 Bilibili 用户的 Cookie 已过期');
    }
    const comics = response.data.data;

    return {
        title: `${name} 的追漫更新 - 哔哩哔哩漫画`,
        link,
        item: comics.map((item) => ({
            title: `${item.title} ${item.latest_ep_short_title}`,
            description: `<img src='${item.vcover}'>`,
            pubDate: new Date(item.last_ep_publish_time + ' +0800'),
            link: `https://manga.bilibili.com/detail/mc${item.comic_id}`,
        })),
    };
}
