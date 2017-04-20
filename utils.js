let request = require('request');
//http://mp.weixin.qq.com/debug/cgi-bin/sandboxinfo?action=showinfo&t=sandbox/index

function getJSON(url, callback) {
  return new Promise((resolve, reject) => {
    request(url, (err, response, body) => {
      if(err){
        reject(err);
      }else{
        resolve(JSON.parse(body));
      }
      }
    )
  });

}
exports.getJSON = getJSON;
