import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';

const host = 'https://ifi-audio.com';

export const route: Route = {
    path: '/download/:val/:id',
    categories: ['university'],
    example: '/ifi-audio/download/1503007035/44472',
    parameters: { val: 'product val', id: 'product id' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Download Hub',
    maintainers: ['EthanWng97'],
    handler,
};

async function handler(ctx) {
    const { val, id } = ctx.req.param();

    const url = host + '/wp-admin/admin-ajax.php';
    const response = await got({
        method: 'post',
        url,
        headers: {
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: 'action=ifi-ff-get-firmware&val=' + val + '&id=' + id,
    });
    const markup = response.data.data.markup;
    const $ = load(markup);
    const latestTitle = $('li[data-category=firmware]:first h4').text();
    const latestDownloadLink = $('li[data-category=firmware]:first a').attr('href');
    return {
        title: 'iFi audio Download Hub',
        link: 'https://ifi-audio.com/download-hub/',
        description: 'iFi audio Download Hub',
        item: [
            {
                title: latestTitle,
                description: markup,
                link: latestDownloadLink,
            },
        ],
    };
}
