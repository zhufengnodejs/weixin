let express = require('express');
let fs = require('fs');
let path = require('path');
var sha1 = require('sha1');
let uuid = require('uuid');
let getJSON = require('./utils').getJSON;
let {APPID, SECRET, token, callback} = require('./settings.json');
let app = express();
app.set('views', path.resolve('views'));
app.set('view engine', 'html');
app.engine('.html', require('ejs').__express);

app.get('/auth', function (req, res) {
  var signature = req.query.signature;
  var nonce = req.query.nonce;
  var timestamp = req.query.timestamp;
  var echostr = req.query.echostr;
  var str = [token, timestamp, nonce].sort().join('');
  var shaStr = sha1(str);
  if (shaStr == signature) {
    res.send(echostr + '');
  } else {
    res.send('wrong');
  }
});

app.get('/', function (req, res) {
  let authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=${callback}&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect`;
  res.redirect(authUrl);
});
app.get('/callback', async function (req, res) {
  let {code} = req.query;
  let access_tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${SECRET}&code=${code}&grant_type=authorization_code`;
  let tokenObj = await getJSON(access_tokenUrl);
  let {access_token, openid} = tokenObj;
  let infoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
  let userInfo = await getJSON(infoUrl);
  let timestamp = Date.now();
  let noncestr = require('crypto').createHash('sha1').update('xx').digest('hex').slice(0,16)
  let callbackUrl = `http://work.zhufengpeixun.cn/callback?code=${code}&state=STATE`;
  let ticketTokenObj = await getJSON(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`);
  let ticket_access_token = ticketTokenObj.access_token;
  let ticketUrl = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${ticket_access_token}&type=jsapi`;
  let ticketObj = await getJSON(ticketUrl);
  let jsapi_ticket = ticketObj.ticket;
  let signature = `jsapi_ticket=${jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${callbackUrl}`;
  signature = sha1(signature);
  res.render('user', {APPID, userInfo, timestamp, noncestr, signature, jsapi_ticket});
});

//获取16位随机码
function getRandCode() {
  return uuid.v4();
}
app.listen(80);
