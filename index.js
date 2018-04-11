const express = require('express');
const logger = require('./utils/logger');

logger.info('🍻 RSSHub start! Cheers!');

const app = express();

app.all('*', require('./routes/all'));

// bilibili
app.get('/bilibili/user/video/:uid', require('./routes/bilibili/video'));
app.get('/bilibili/user/fav/:uid', require('./routes/bilibili/fav'));
app.get('/bilibili/user/coin/:uid', require('./routes/bilibili/coin'));
app.get('/bilibili/user/dynamic/:uid', require('./routes/bilibili/dynamic'));
app.get('/bilibili/partion/:tid', require('./routes/bilibili/partion'));
app.get('/bilibili/bangumi/:seasonid', require('./routes/bilibili/bangumi'));

// weibo
app.get('/weibo/user/:uid', require('./routes/weibo/user'));

app.listen(1200);