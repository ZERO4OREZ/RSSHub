import { Route } from '@/types';
import { ProcessFeed } from './utils';

export const route: Route = {
    path: '/items/work/:id/:order?',
    categories: ['program-update'],
    example: '/hpoi/items/work/4117491',
    parameters: { id: '作品 ID', order: '排序, 见下表，默认为 add' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '作品周边',
    maintainers: ['DIYgod'],
    handler,
};

async function handler(ctx) {
    ctx.set('data', await ProcessFeed('work', ctx.req.param('id'), ctx.req.param('order')));
}
