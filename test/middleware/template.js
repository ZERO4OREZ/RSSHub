const supertest = require('supertest');
const { server } = require('../../lib/index');
const request = supertest(server);
const Parser = require('rss-parser');
const parser = new Parser();

afterAll(() => {
    server.close();
});

describe('template', () => {
    it(`.rss`, async () => {
        const response1 = await request.get('/test/1.rss');
        const parsed1 = await parser.parseString(response1.text);

        expect(parsed1).toEqual(expect.any(Object));
        expect(parsed1.title).toEqual(expect.any(String));
        expect(parsed1.description).toEqual(expect.any(String));
        expect(parsed1.link).toEqual(expect.any(String));
        expect(parsed1.lastBuildDate).toEqual(expect.any(String));
        expect(parsed1.ttl).toEqual(expect.any(String));
        expect(parsed1.items).toEqual(expect.any(Array));

        expect(parsed1.items[0]).toEqual(expect.any(Object));
        expect(parsed1.items[0].title).toEqual(expect.any(String));
        expect(parsed1.items[0].link).toEqual(expect.any(String));
        expect(parsed1.items[0].pubDate).toEqual(expect.any(String));
        expect(parsed1.items[0].author).toEqual(expect.any(String));
        expect(parsed1.items[0].content).toEqual(expect.any(String));
        expect(parsed1.items[0].guid).toEqual(expect.any(String));

        const response2 = await request.get('/test/1');
        const parsed2 = await parser.parseString(response2.text);
        delete parsed1.lastBuildDate;
        delete parsed2.lastBuildDate;
        expect(parsed2).toMatchObject(parsed1);
    });

    it(`.atom`, async () => {
        const response = await request.get('/test/1.atom');
        const parsed = await parser.parseString(response.text);

        expect(parsed).toEqual(expect.any(Object));
        expect(parsed.title).toEqual(expect.any(String));
        expect(parsed.link).toEqual(expect.any(String));
        expect(parsed.lastBuildDate).toEqual(expect.any(String));
        expect(parsed.items).toEqual(expect.any(Array));

        expect(parsed.items[0]).toEqual(expect.any(Object));
        expect(parsed.items[0].title).toEqual(expect.any(String));
        expect(parsed.items[0].link).toEqual(expect.any(String));
        expect(parsed.items[0].pubDate).toEqual(expect.any(String));
        expect(parsed.items[0].author).toEqual(expect.any(String));
        expect(parsed.items[0].content).toEqual(expect.any(String));
        expect(parsed.items[0].id).toEqual(expect.any(String));
    });

    it(`.json`, async () => {
        const response = await request.get('/test/1.json');
        expect(response.status).toBe(404);
        expect(response.text).toMatch(/RSSHub 发生了一些意外: <pre>Error: <b>JSON output had been removed/);
    });

    it(`long title`, async () => {
        const response = await request.get('/test/long');
        const parsed = await parser.parseString(response.text);
        expect(parsed.items[0].title.length).toBe(103);
    });

    it(`replace newlines with <br>`, async () => {
        const response = await request.get('/test/linebreaker');
        const parsed = await parser.parseString(response.text);
        const test = parsed.items[0].content;

        // line breakers should have been replaced with <br>
        expect(test).not.toContain('\r');
        expect(test).not.toContain('\n');

        // content should not start with and/or end with <br>|<br/>, which are meaningless
        expect(test).toEqual(expect.not.stringMatching(/^(<br>| |<br\/>)+|(<br>| |<br\/>)+$/g));
    });
});
