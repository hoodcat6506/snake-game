(function(exports) {
  var instance = exports.snakeGame = {
    init:        init,
    start:       start,
    restart:     restart,
    pause:       pause,
    end:         end,
    initSnake:   initSnake,
    renderSnake: renderSnake,
  };

  var canvas = {};
  var context = {};
  var timeInfo = {
    start:     0,
    end:       null,
    prevFrame: null
  };
  var isLock = false;
  var snake = {};
  var fruit = {};
  var state = 0; // 0: ready, 1: play, 2: pause, 3: end
  var score = 0;

  function init() {
    state = 0;
    _cache();
    _bindEvent();
    _render();

    delete instance.init;
  }

  function start() {
    // start game
    initSnake();
    renderSnake();
    state = 1;
    _renderFrame(0);
  }

  function restart() {
    // restart game
    state = 1;
  }

  function pause() {
    // pause game
    state = 2;
  }

  function end() {
    // end game
    state = 3;
  }

  function initSnake() {
    snake = {
      bodyLength: 3,
      speed:      1,
      head:       {
        x:      4, // head x
        y:      4, // head y
        direct: 1, // 00: up, 01: right, 10: down, 11: left
      },
      tail: {
        x:      2, // tail x
        y:      4, // tail y
        direct: 1, // 00: up, 01: right, 10: down, 11: left
      },
      pathQueue: [], // path queue
    };
  }

  function renderSnake() {
    // render snake
    var path = snake.head;
    for(var i = 0; i < snake.pathQueue.length; i++) {
      _drawLine(path, snake.pathQueue[i]);
      path = snake.pathQueue[i];
    }

    _drawLine(path, snake.tail);
  }

  function growUp() {
    snake.bodyLength++;
    snake.pathQueue.push(Object.assign({}, snake.tail));
    switch(snake.tail.direct) {
      case 0:
        snake.tail.y -= 1;
        break;
      case 1:
        snake.tail.x += 1;
        break;
      case 2:
        snake.tail.y += 1;
        break;
      case 3:
        snake.tail.x -= 1;
        break;
      default:
        break;
    }
  }

  /**
   * caching
   */
  function _cache() {
    canvas.background = document.querySelector('canvas.-fd-background');
    canvas.playZone = document.querySelector('canvas.-fd-play-zone');

    context.background = canvas.background.getContext('2d');
    context.playZone = canvas.playZone.getContext('2d');
  }

  /**
   * bing event
   */
  function _bindEvent() {
    window.addEventListener('keydown', _keydownHandler);
  }

  /**
   * rendering
   */
  function _render() {
    var img = new Image();
    img.src = './res/img/background.png';
    img.addEventListener('load', (event) => context.background.drawImage(this, 0, 0));
  }

  /**
   * loop
   * 
   * @param {DOMHighResTimeStamp} timestamp
   */
  function _renderFrame(timestamp) {
    if(state === 1) {
      timeInfo.prevFrame = timeInfo.prevFrame || timestamp;

      if (timestamp - timeInfo.prevFrame >= 1000 * snake.speed) {
        _clearPlayZone();
        // move tail
        if(snake.pathQueue.length) {
          var path = snake.pathQueue[0];
          if(path.x === snake.tail.x) {
            snake.tail.direct = (path.y < snake.tail.y) ? 0 : 2;
          } else {
            snake.tail.direct = (path.x < snake.tail.x) ? 3 : 1;
          }
        } else {
          snake.tail.direct = snake.head.direct;
        }

        // move tail
        switch(snake.tail.direct) {
          case 0:
            snake.tail.y -= 1;
            break;
          case 1:
            snake.tail.x += 1;
            break;
          case 2:
            snake.tail.y += 1;
            break;
          case 3:
            snake.tail.x -= 1;
            break;
          default:
            break;
        }

        // move head
        switch(snake.head.direct) {
          case 0:
            snake.head.y -= 1;
            break;
          case 1:
            snake.head.x += 1;
            break;
          case 2:
            snake.head.y += 1;
            break;
          case 3:
            snake.head.x -= 1;
            break;
          default:
            break;
        }

        // TODO: check eat fruit

        // check path
        if(snake.pathQueue.length) {
          if(snake.pathQueue[0].x === snake.tail.x && snake.pathQueue[0].y === snake.tail.y) {
            snake.pathQueue.shift();
            console.log(path);
          }
        }

        timeInfo.prevFrame = timestamp;
        renderSnake();
        isLock = false;
      }
    }

    if(state === 3) {
      window.cancelAnimationFrame(_renderFrame);
      timeInfo.end = timestamp;
      console.log(timeInfo.end - timeInfo.start);
    } else {
      window.requestAnimationFrame(_renderFrame);
    }
  }

  /**
   * draw snake body by pathQueue
   *
   * @param {object} path1
   * @param {object} path2
   */
  function _drawLine(path1, path2) {
    if (path1.x === path2.x) {
      var [minYPoint, maxYPoint] = (path1.y < path2.y) ? [path1, path2] : [path2, path1];
      context.playZone.fillRect(minYPoint.x * 30, minYPoint.y * 30, 30, (maxYPoint.y - minYPoint.y + 1) * 30);
    } else {
      var [minXPoint, maxXPoint] = (path1.x < path2.x) ? [path1, path2] : [path2, path1];
      context.playZone.fillRect(minXPoint.x * 30, minXPoint.y * 30, (maxXPoint.x - minXPoint.x + 1) * 30, 30);
    }
  }

  function _renderFruit() {
    // reder Fruit
  }

  /**
   * clear PlayZone canvas
   */
  function _clearPlayZone() {
    context.playZone.clearRect(0, 0, canvas.playZone.width, canvas.playZone.height);
  }

  /**
   * keydown event handler
   *
   * @param {KeyboardEvent} event KeyboardEvent
   */
  function _keydownHandler(event) {
    // is playing
    if (!isLock && state === 1) {
      var direct = [38, 39, 40, 37].indexOf(event.keyCode);
      if(direct >= 0) {
        if ((direct & 1) !== (snake.head.direct & 1)) {
          isLock = true;
          snake.head.direct = direct;
          snake.pathQueue.push(Object.assign({}, snake.head));
        }
      }
    }

    ({
      13: start,
      27: end
    })[event.keyCode]();
  }

  return exports;
}(this));

snakeGame.init();
