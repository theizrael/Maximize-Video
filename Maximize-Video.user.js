// ==UserScript==
// @name                Maximize Video
// @namespace           https://github.com/theizrael/Maximize-Video
// @description         Maximize all video players.Support Piture-in-picture.
// @author              Theizrael
// @homepage            https://github.com/theizrael/Maximize-Video/
// @icon                https://raw.github.com/theizrael/Maximize-Video/master/favicons.png
// @updateURL           https://github.com/theizrael/Maximize-Video/raw/master/Maximize-Video.user.js
// @downloadURL         https://github.com/theizrael/Maximize-Video/raw/master/Maximize-Video.user.js
// @supportURL          https://github.com/theizrael/Maximize-Video/issues
// @include             *
// @exclude             *www.w3school.com.cn*
// @version             11.7
// @run-at              document-end
// ==/UserScript==

function exec(fn) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = '(' + fn + ')();';
    document.body.appendChild(script);
    document.body.removeChild(script);
}

exec(function() {

    var gv = {
        isFull: false,
        isIframe: false,
        autoCheckCount: 0
    };

    //Html5 Rule [player outermost layer], suitable for adaptive size HTML5 player
    var html5Rules = {
        'www.acfun.cn': ['.player-container .player'],
        'www.bilibili.com': ['#bilibiliPlayer'],
        'www.douyu.com': ['#js-player-video-case'],
        'www.huya.com': ['#videoContainer'],
        'www.twitch.tv': ['.player'],
        'www.youtube.com': ['#movie_player'],
        'www.yy.com': ['#player']
    };

    //Universal html5 player
    var generalPlayerRules = ['.dplayer', '.video-js', '.jwplayer'];

    if (window.top !== window.self) {
        gv.isIframe = true;
    }

    if (navigator.language.toLocaleLowerCase() == 'zh-cn') {
        gv.btnText = {
            max: '网页全屏',
            pip: '画中画',
            tip: 'Iframe内视频，请用鼠标点击视频后重试'
        };
    } else {
        gv.btnText = {
            max: 'Maximize',
            pip: 'PicInPic',
            tip: 'Iframe video. Please click on the video and try again'
        };
    }

    var tool = {
        getRect: function(element) {
            var rect = element.getBoundingClientRect();
            var scroll = tool.getScroll();
            return {
                pageX: rect.left + scroll.left,
                pageY: rect.top + scroll.top,
                screenX: rect.left,
                screenY: rect.top
            };
        },
        isHalfFullClient: function(element) {
            var client = tool.getClient();
            var rect = tool.getRect(element);
            if ((Math.abs(client.width - element.offsetWidth) < 21 && rect.screenX < 20) || (Math.abs(client.height - element.offsetHeight) < 21 && rect.screenY < 10)) {
                if (Math.abs(element.offsetWidth / 2 + rect.screenX - client.width / 2) < 21 && Math.abs(element.offsetHeight / 2 + rect.screenY - client.height / 2) < 21) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        isAllFullClient: function(element) {
            var client = tool.getClient();
            var rect = tool.getRect(element);
            if ((Math.abs(client.width - element.offsetWidth) < 21 && rect.screenX < 20) && (Math.abs(client.height - element.offsetHeight) < 21 && rect.screenY < 10)) {
                return true;
            } else {
                return false;
            }
        },
        getScroll: function() {
            return {
                left: document.documentElement.scrollLeft || document.body.scrollLeft,
                top: document.documentElement.scrollTop || document.body.scrollTop
            };
        },
        getClient: function() {
            return {
                width: document.compatMode == 'CSS1Compat' ? document.documentElement.clientWidth : document.body.clientWidth,
                height: document.compatMode == 'CSS1Compat' ? document.documentElement.clientHeight : document.body.clientHeight
            };
        },
        addStyle: function(css) {
            var style = document.createElement('style');
            style.type = 'text/css';
            var node = document.createTextNode(css);
            style.appendChild(node);
            document.head.appendChild(style);
            return style;
        },
        matchRule: function(str, rule) {
            return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
        },
        createButton: function(id) {
            var btn = document.createElement('tbdiv');
            btn.id = id;
            btn.onclick = function() {
                maximize.playerControl();
            };
            document.body.appendChild(btn);
            return btn;
        },
        addTip: async function(str) {
            if (!document.getElementById('catTip')) {
                var tip = document.createElement('tbdiv');
                tip.id = 'catTip';
                tip.innerHTML = str;
                tip.style.cssText = 'transition: all 0.8s ease-out;background: none repeat scroll 0 0 #27a9d8;color: #FFFFFF;font: 1.1em "微软雅黑";margin-left: -250px;overflow: hidden;padding: 10px;position: fixed;text-align: center;bottom: 100px;z-index: 300;',
                    document.body.appendChild(tip);
                tip.style.right = -tip.offsetWidth - 5 + 'px';
                await new Promise(resolve => {
                    tip.style.display = 'block';
                    setTimeout(() => {
                        tip.style.right = '25px';
                        resolve('OK');
                    }, 300);
                });
                await new Promise(resolve => {
                    setTimeout(() => {
                        tip.style.right = -tip.offsetWidth - 5 + 'px';
                        resolve('OK');
                    }, 3500);
                });
                await new Promise(resolve => {
                    setTimeout(() => {
                        document.body.removeChild(tip);
                        resolve('OK');
                    }, 1000);
                });
            }
        }
    };

    var setButton = {
        init: function() {
            if (!document.getElementById('playerControlBtn')) {
                init();
            }
            if (gv.isIframe && tool.isHalfFullClient(gv.player)) {
                window.parent.postMessage('iframeVideo', '*');
                return;
            }
            this.show();
        },
        show: function() {
            gv.player.removeEventListener('mouseleave', handle.leavePlayer, false);
            gv.player.addEventListener('mouseleave', handle.leavePlayer, false);

            if (!gv.isFull) {
                document.removeEventListener('scroll', handle.scrollFix, false);
                document.addEventListener('scroll', handle.scrollFix, false);
            }
            gv.controlBtn.style.display = 'block';
            gv.controlBtn.style.visibility = 'visible';
            if (document.pictureInPictureEnabled && gv.player.nodeName != 'OBJECT' && gv.player.nodeName != 'EMBED') {
                gv.picinpicBtn.style.display = 'block';
                gv.picinpicBtn.style.visibility = 'visible';
            }
            this.locate();
        },
        locate: function() {
            var playerRect = tool.getRect(gv.player);
            gv.controlBtn.style.opacity = '0.5';
            gv.controlBtn.innerHTML = gv.btnText.max;
            gv.controlBtn.style.top = playerRect.screenY - 20 + 'px';
            gv.controlBtn.style.left = playerRect.screenX - 64 + gv.player.offsetWidth + 'px';
            gv.picinpicBtn.style.opacity = '0.5';
            gv.picinpicBtn.innerHTML = gv.btnText.pip;
            gv.picinpicBtn.style.top = gv.controlBtn.style.top;
            gv.picinpicBtn.style.left = playerRect.screenX - 64 + gv.player.offsetWidth - 54 + 'px';
        }
    };

    var handle = {
        getPlayer: function(e) {
            if (gv.isFull) {
                return;
            }
            gv.mouseoverEl = e.target;
            var hostname = document.location.hostname;
            var players = [];
            for (var i in html5Rules) {
                if (tool.matchRule(hostname, i)) {
                    for (var v of html5Rules[i]) {
                        players = document.querySelectorAll(v);
                        if (players.length > 0) {
                            break;
                        }
                    }
                    break;
                }
            }
            if (players.length == 0) {
                for (var v of generalPlayerRules) {
                    players = document.querySelectorAll(v);
                    if (players.length > 0) {
                        break;
                    }
                }
            }
            if (players.length == 0 && e.target.nodeName != 'VIDEO' && document.querySelectorAll('video').length > 0) {
                var videos = document.querySelectorAll('video');
                for (var v of videos) {
                    var vRect = v.getBoundingClientRect();
                    if (e.clientX >= vRect.x - 2 && e.clientX <= vRect.x + vRect.width + 2 && e.clientY >= vRect.y - 2 && e.clientY <= vRect.y + vRect.height + 2 && v.offsetWidth > 399 && v.offsetHeight > 220) {
                        players = [];
                        players[0] = handle.autoCheck(v);
                        gv.autoCheckCount = 1;
                        break;
                    }
                }
            }
            if (players.length > 0) {
                var path = e.path || e.composedPath();
                for (var v of players) {
                    if (path.indexOf(v) > -1) {
                        gv.player = v;
                        setButton.init();
                        return;
                    }
                }
            }
            switch (e.target.nodeName) {
                case 'VIDEO':
                case 'OBJECT':
                case 'EMBED':
                    if (e.target.offsetWidth > 399 && e.target.offsetHeight > 220) {
                        gv.player = e.target;
                        setButton.init();
                    }
                    break;
                default:
                    handle.leavePlayer();
            }
        },
        autoCheck: function(v) {
            var tempPlayer, el = v;
            gv.playerChilds = [];
            gv.playerChilds.push(v);
            while (el = el.parentNode) {
                if (Math.abs(v.offsetWidth - el.offsetWidth) < 15 && Math.abs(v.offsetHeight - el.offsetHeight) < 15) {
                    tempPlayer = el;
                    gv.playerChilds.push(el);
                } else {
                    break;
                }
            }
            return tempPlayer;
        },
        leavePlayer: function() {
            if (gv.controlBtn.style.visibility == 'visible') {
                gv.controlBtn.style.opacity = '';
                gv.controlBtn.style.visibility = '';
                gv.picinpicBtn.style.opacity = '';
                gv.picinpicBtn.style.visibility = '';
                gv.player.removeEventListener('mouseleave', handle.leavePlayer, false);
                document.removeEventListener('scroll', handle.scrollFix, false);
            }
        },
        scrollFix: function(e) {
            clearTimeout(gv.scrollFixTimer);
            gv.scrollFixTimer = setTimeout(() => {
                setButton.locate();
            }, 20);
        },
        hotKey: function(e) {
            
            //默认退出键为ESC。需要修改为其他快捷键的请搜索"keycode"，修改为按键对应的数字。
            if (e.keyCode == 27) {
                maximize.playerControl();
            }
            //默认画中画快捷键为F2。
            if (e.keyCode == 113) {
                pictureInPicture();
            }
        },
        receiveMessage: async function(e) {
            switch (e.data) {
                case 'iframePicInPic':
                    console.log('messege:iframePicInPic');
                    if (!document.pictureInPictureElement) {
                        await document.querySelector('video').requestPictureInPicture()
                            .catch(error => {
                                tool.addTip(gv.btnText.tip);
                            });
                    } else {
                        await document.exitPictureInPicture();
                    }
                    break;
                case 'iframeVideo':
                    console.log('messege:iframeVideo');
                    if (!gv.isFull) {
                        gv.player = gv.mouseoverEl;
                        setButton.init();
                    }
                    break;
                case 'parentFull':
                    console.log('messege:parentFull');
                    gv.player = gv.mouseoverEl;
                    if (gv.isIframe) {
                        window.parent.postMessage('parentFull', '*');
                    }
                    maximize.checkParent();
                    maximize.fullWin();
                    if (getComputedStyle(gv.player).left != '0px') {
                        tool.addStyle('#htmlToothbrush #bodyToothbrush .playerToothbrush {left:0px !important;width:100vw !important;}');
                    }
                    gv.isFull = true;
                    break;
                case 'parentSmall':
                    console.log('messege:parentSmall');
                    if (gv.isIframe) {
                        window.parent.postMessage('parentSmall', '*');
                    }
                    maximize.smallWin();
                    break;
                case 'innerFull':
                    console.log('messege:innerFull');
                    if (gv.player.nodeName == 'IFRAME') {
                        gv.player.contentWindow.postMessage('innerFull', '*');
                    }
                    maximize.checkParent();
                    maximize.fullWin();
                    break;
                case 'innerSmall':
                    console.log('messege:innerSmall');
                    if (gv.player.nodeName == 'IFRAME') {
                        gv.player.contentWindow.postMessage('innerSmall', '*');
                    }
                    maximize.smallWin();
                    break;
            }
        }
    };

    var maximize = {
        playerControl: function() {
            if (!gv.player) {
                return;
            }
            this.checkParent();
            if (!gv.isFull) {
                if (gv.isIframe) {
                    window.parent.postMessage('parentFull', '*');
                }
                if (gv.player.nodeName == 'IFRAME') {
                    gv.player.contentWindow.postMessage('innerFull', '*');
                }
                this.fullWin();
                if (gv.autoCheckCount > 0 && !tool.isHalfFullClient(gv.playerChilds[0])) {
                    if (gv.autoCheckCount > 10) {
                        for (var v of gv.playerChilds) {
                            v.classList.add('videoToothbrush');

                        }
                        return;
                    }
                    var tempPlayer = handle.autoCheck(gv.playerChilds[0]);
                    gv.autoCheckCount++;
                    maximize.playerControl();
                    gv.player = tempPlayer;
                    maximize.playerControl();
                } else {
                    gv.autoCheckCount = 0;
                }
            } else {
                if (gv.isIframe) {
                    window.parent.postMessage('parentSmall', '*');
                }
                if (gv.player.nodeName == 'IFRAME') {
                    gv.player.contentWindow.postMessage('innerSmall', '*');
                }
                this.smallWin();
            }
        },
        checkParent: function() {
            if (gv.isFull) {
                return;
            }
            gv.playerParents = [];
            var full = gv.player;
            while (full = full.parentNode) {
                if (full.nodeName == 'BODY') {
                    break;
                }
                if (full.getAttribute) {
                    gv.playerParents.push(full);
                }
            }
        },
        fullWin: function() {
            if (!gv.isFull) {
                document.removeEventListener('mouseover', handle.getPlayer, false);
                gv.backHtmlId = document.body.parentNode.id;
                gv.backBodyId = document.body.id;
                if (document.location.hostname == 'www.youtube.com' && document.querySelector('#movie_player .ytp-size-button .ytp-svg-shadow').getBoundingClientRect().width == 20) {
                    document.querySelector('#movie_player .ytp-size-button').click();
                    gv.ytbStageChange = true;
                }
                gv.leftBtn.style.display = 'block';
                gv.rightBtn.style.display = 'block';
                gv.picinpicBtn.style.display = '';
                gv.controlBtn.style.display = '';
                this.addClass();
            }
            gv.isFull = true;
        },
        addClass: function() {
            document.body.parentNode.id = 'htmlToothbrush';
            document.body.id = 'bodyToothbrush';
            for (var v of gv.playerParents) {
                v.classList.add('parentToothbrush');
                //父元素position:fixed会造成层级错乱
                if (getComputedStyle(v).position == 'fixed') {
                    v.classList.add('absoluteToothbrush');
                }
            }
            gv.player.classList.add('playerToothbrush');
            if (gv.player.nodeName == 'VIDEO') {
                gv.backControls = gv.player.controls;
                gv.player.controls = true;
            }
            window.dispatchEvent(new Event('resize'));
        },
        smallWin: function() {
            document.body.parentNode.id = gv.backHtmlId;
            document.body.id = gv.backBodyId;
            for (var v of gv.playerParents) {
                v.classList.remove('parentToothbrush');
                v.classList.remove('absoluteToothbrush');
            }
            gv.player.classList.remove('playerToothbrush');
            if (document.location.hostname == 'www.youtube.com' && gv.ytbStageChange) {
                document.querySelector('#movie_player .ytp-size-button').click();
                gv.ytbStageChange = false;
            }
            if (gv.player.nodeName == 'VIDEO') {
                gv.player.controls = gv.backControls;
            }
            gv.leftBtn.style.display = '';
            gv.rightBtn.style.display = '';
            gv.controlBtn.style.display = '';
            document.addEventListener('mouseover', handle.getPlayer, false);
            window.dispatchEvent(new Event('resize'));
            gv.isFull = false;
        }
    };

    var pictureInPicture = function() {
        if (!document.pictureInPictureElement) {
            if (gv.player) {
                if (gv.player.nodeName == 'IFRAME') {
                    gv.player.contentWindow.postMessage('iframePicInPic', '*');
                } else {
                    gv.player.parentNode.querySelector('video').requestPictureInPicture();
                }
            } else {
                document.querySelector('video').requestPictureInPicture();
            }
        } else {
            document.exitPictureInPicture();
        }
    }

    var init = function() {
        gv.picinpicBtn = document.createElement('tbdiv');
        gv.picinpicBtn.id = "picinpicBtn";
        gv.picinpicBtn.onclick = function() {
            pictureInPicture();
        };
        document.body.appendChild(gv.picinpicBtn);
        gv.controlBtn = tool.createButton('playerControlBtn');
        gv.leftBtn = tool.createButton('leftFullStackButton');
        gv.rightBtn = tool.createButton('rightFullStackButton');
        if (getComputedStyle(gv.controlBtn).position != 'fixed') {
            tool.addStyle([
                '#htmlToothbrush #bodyToothbrush .parentToothbrush .bilibili-player-video {margin:0 !important;}',
                '#htmlToothbrush, #bodyToothbrush {overflow:hidden !important;zoom:100% !important;}',
                '#htmlToothbrush #bodyToothbrush .parentToothbrush {overflow:visible !important;z-index:auto !important;transform:none !important;-webkit-transform-style:flat !important;transition:none !important;contain:none !important;}',
                '#htmlToothbrush #bodyToothbrush .absoluteToothbrush {position:absolute !important;}',
                '#htmlToothbrush #bodyToothbrush .playerToothbrush {position:fixed !important;top:0px !important;left:0px !important;width:100vw !important;height:100vh !important;max-width:none !important;max-height:none !important;min-width:0 !important;min-height:0 !important;margin:0 !important;padding:0 !important;z-index:2147483647 !important;border:none !important;background-color:#000 !important;transform:none !important;}',
                '#htmlToothbrush #bodyToothbrush .parentToothbrush video {object-fit:contain !important;}',
                '#htmlToothbrush #bodyToothbrush .parentToothbrush .videoToothbrush {width:100vw !important;height:100vh !important;}',
                '#playerControlBtn {text-shadow: none;visibility:hidden;opacity:0;display:none;transition: all 0.5s ease;cursor: pointer;font: 12px "微软雅黑";margin:0;width:64px;height:20px;line-height:20px;border:none;text-align: center;position: fixed;z-index:2147483647;background-color: #27A9D8;color: #FFF;} #playerControlBtn:hover {visibility:visible;opacity:1;background-color:#2774D8;}',
                '#picinpicBtn {text-shadow: none;visibility:hidden;opacity:0;display:none;transition: all 0.5s ease;cursor: pointer;font: 12px "微软雅黑";margin:0;width:53px;height:20px;line-height:20px;border:none;text-align: center;position: fixed;z-index:2147483647;background-color: #27A9D8;color: #FFF;} #picinpicBtn:hover {visibility:visible;opacity:1;background-color:#2774D8;}',
                '#leftFullStackButton{display:none;position:fixed;width:1px;height:100vh;top:0;left:0;z-index:2147483647;background:#000;}',
                '#rightFullStackButton{display:none;position:fixed;width:1px;height:100vh;top:0;right:0;z-index:2147483647;background:#000;}'
            ].join('\n'));
        }
    };

    init();

    document.addEventListener('mouseover', handle.getPlayer, false);
    document.addEventListener('keydown', handle.hotKey, false);
    window.addEventListener('message', handle.receiveMessage, false);

});
