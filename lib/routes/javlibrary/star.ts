import { Route } from '@/types';
import cache from '@/utils/cache';
import { defaultMode, defaultLanguage, rootUrl, ProcessItems } from './utils';

export const route: Route = {
    path: '/star/:id/:language?/:mode?',
    categories: ['picture'],
    example: '/javlibrary/star/abbds/en',
    parameters: { id: 'Star id, can be found in URL', language: 'Language, see below, Japanese by default, as `ja`', mode: 'Mode, see below, videos with comments (by date) by default, as `1`' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: true,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: 'Videos by star',
    maintainers: ['nczitzk'],
    handler,
};

async function handler(ctx) {
    const id = ctx.req.param('id');
    const mode = ctx.req.param('mode') ?? defaultMode;
    const language = ctx.req.param('language') ?? defaultLanguage;
    const currentUrl = `${rootUrl}/${language}/vl_star.php?list&s=${id}&mode=${mode}`;

    ctx.set('data', await ProcessItems(language, currentUrl, cache.tryGet));
}
