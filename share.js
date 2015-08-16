var xhr = new XMLHttpRequest;

function post (content) {
  xhr.open('post', 'https://api.github.com/gists');
  xhr.onload = function () {
    var rateLimit = getRateLimitInfoFromHeaders(xhr);
    info(xhr.response.html_url, rateLimit.left, rateLimit.total);
  };
  xhr.responseType = 'json';
  xhr.send(JSON.stringify({
    "description": "joshVR snapshot",
    "public": true,
    "files": {
      "joshVR.xml": {
        "content": content,
      }
    }
  }));
};

function getRateLimitInfoFromHeaders (xhr) {
  return {
    total: xhr.getResponseHeader('X-RateLimit-Limit'),
    left: xhr.getResponseHeader('X-RateLimit-Remaining'),
    reset: xhr.getResponseHeader('X-RateLimit-Reset'),
  };
};

function createShareButton (cb) {
  var div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.bottom = '10px';
  div.style.zIndex = 3;
  //div.style.border = '1px solid yellow';
  div.id = 'share';
  var button = document.createElement('button');
  button.textContent = 'share'
  button.addEventListener('click', cb);
  div.appendChild(button);
  document.body.appendChild(div);
};

function findOrCreateById (tag, id) {
  var ele = document.getElementById(id);
  if (!ele) {
    ele = document.createElement(tag);
    ele.id = id;
  }
  return ele;
};

function info (url, rateLimit, rateLimitTotal) {
  var share = document.getElementById('share');
  var p = findOrCreateById('p', 'shareInfo');
  p.innerHTML = '';
  var a = document.createElement('a');
  a.href = url;
  a.textContent = url;
  a.style.color = 'orange';
  p.appendChild(a);
  p.appendChild(document.createTextNode(', ' + rateLimit + ' / ' + rateLimitTotal +
    ' shares left this hour. '));
  p.style.display = 'inline';
  p.style.color = 'yellow';
  var a2 = document.createElement('a');
  a2.href = 'https://gist.github.com/search?utf8=%E2%9C%93&q=joshVR+filename%3AjoshVR.xml+anon%3Atrue+language%3Axml';
  a2.textContent = 'Search for more.'
  a2.style.color = 'orange';
  p.appendChild(a2);
  share.appendChild(p);
};

module.exports = {
  post: post,
  createShareButton: createShareButton,
};

