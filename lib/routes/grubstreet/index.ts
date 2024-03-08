import { Route } from '@/types';
import utils from './utils';

export const route: Route = {
    path: '/',
    radar: {
        source: ['grubstreet.com/'],
        target: '',
    },
    name: 'Unknown',
    maintainers: ['loganrockmore'],
    handler,
};

async function handler(ctx) {
    const url = `https://www.grubstreet.com/_components/newsfeed/instances/grubstreet-index@published`;
    const title = `Grub Street`;
    const description = `New York Magazine's Food and Restaurant Blog`;

    ctx.set('data', await utils.getData(ctx, url, title, description));
}
