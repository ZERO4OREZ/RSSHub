import { Route } from '@/types';
import utils from './utils';
import { load } from 'cheerio';
import got from '@/utils/got';

export const route: Route = {
    path: '/channel/:id',
    categories: ['bbs'],
    example: '/thepaper/channel/25950',
    parameters: { id: '频道 id，可在频道页 URL 中找到' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '频道',
    maintainers: ['xyqfer', 'nczitzk', 'bigfei'],
    handler,
};

async function handler(ctx) {
    const id = ctx.req.param('id');
    const channel_url = `https://m.thepaper.cn/channel/${id}`;
    const channel_url_resp = await got(channel_url);
    const channel_url_data = JSON.parse(load(channel_url_resp.data)('#__NEXT_DATA__').html());

    const resp = await got.post('https://api.thepaper.cn/contentapi/nodeCont/getByChannelId', {
        json: {
            channelId: id,
        },
    });
    const list = resp.data.data.list;

    const items = await Promise.all(list.map((item) => utils.ProcessItem(item, ctx)));
    return {
        title: `澎湃新闻频道 - ${utils.ChannelIdToName(id, channel_url_data)}`,
        link: channel_url,
        item: items,
        itunes_author: '澎湃新闻',
        image: utils.ExtractLogo(channel_url_resp),
    };
}
