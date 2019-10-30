(function(exports) {
  var instance = exports.snakeGame = {
    init:        init,
    start:       start,
    restart:     restart,
    pause:       pause,
    end:         end,
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
  var state = 0; // 0: ready, 1: play, 2: pause, 3: end
  var score = 0;

  function init() {
    state = 0;
    _cache();
    _bindEvent();
    _render();

    delete instance.init;
  }

  function initSnake() {
    snake = {
      bodyLength: 3,
      speed:      1,
      direct:     1, // 00: up, 01: right, 10: down, 11: left
      head:       {
        x: 4, // head x
        y: 4, // head y
      },
      tail: {
        x: 0, // tail x
        y: 4, // tail y
      },
      pathQueue: [], // path queue
    };
    renderSnake();
  }

  function _cache() {
    canvas.background = document.querySelector('canvas.-fd-background');
    canvas.playZone = document.querySelector('canvas.-fd-play-zone');

    context.background = canvas.background.getContext('2d');
    context.playZone = canvas.playZone.getContext('2d');
  }

  function _bindEvent() {
    window.addEventListener('keydown', keydownHandler);
  }

  function _render() {
    var img = new Image();
    img.src = './res/img/background.png';
    img.addEventListener('load', function(event) {
      context.background.drawImage(this, 0, 0);
    });
  }

  function start() {
    // start game
    initSnake();
    state = 1;
    // window.requestAnimationFrame(renderFrame);
    renderFrame(0);
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

  /**
   *
   * @param {DOMHighResTimeStamp} timestamp
   */
  function renderFrame(timestamp) {
    if(state === 1) {
      timeInfo.prevFrame = timeInfo.prevFrame || timestamp;

      if (timestamp - timeInfo.prevFrame >= 100) {
        // move tail
        if(snake.pathQueue.length) {
          var path = snake.pathQueue[0];
          if(path.x === snake.tail.x) {
            var yIncr = (path.y > snake.tail.y) ? 1 : -1;
            snake.tail.y += yIncr;
          } else {
            var xIncr = (path.x > snake.tail.x) ? 1 : -1;
            snake.tail.x += xIncr;
          }

          if(path.x === snake.tail.x && path.y === snake.tail.y) {
            snake.pathQueue.shift();
          }
        } else {
          switch(snake.direct) {
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

        // move head
        switch(snake.direct) {
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
        timeInfo.prevFrame = timestamp;
        renderSnake();
        _clearTail();
        isLock = false;
        console.log(snake.head.x, snake.head.y);
      }
      // move snake
    }


    if(state === 3) {
      window.cancelAnimationFrame(renderFrame);
      timeInfo.end = timestamp;
      console.log(timeInfo.end - timeInfo.start);
    } else {
      window.requestAnimationFrame(renderFrame);
    }
  }

  function renderSnake() {
    // render snake
    var path = snake.head;
    for(var i = 0; i < snake.pathQueue.length; i++) {
      _drawLine(path, snake.pathQueue[i]);
      path = snake.pathQueue[i];
    }

    if(path.x === snake.tail.x && path.y === snake.tail.y) {
      snake.pathQueue.shift();
    }else {
      _drawLine(path, snake.tail);
    }
  }

  /**
   *
   * @param {object} path1
   * @param {object} path2
   */
  function _drawLine(path1, path2) {
    var incr = null;
    if (path1.x === path2.x) {
      incr = (path1.y > path2.y) ? -1 : 1;
      for(var y = path1.y; y !== path2.y; y += incr) {
        context.playZone.fillRect(path1.x * 30, y * 30, 30, 30);
      }
    } else {
      incr = (path1.x > path2.x) ? -1 : 1;
      for(var x = path1.x; x !== path2.x; x += incr) {
        context.playZone.fillRect(x * 30, path1.y * 30, 30, 30);
      }
    }
  }

  function _clearTail() {
    context.playZone.clearRect(snake.tail.x * 30, snake.tail.y * 30, 30, 30);
  }

  /**
   *
   * @param {KeyboardEvent} event KeyboardEvent
   */
  function keydownHandler(event) {
    // is playing
    if (state === 1) {
      if (!isLock) {
        switch(event.keyCode) {
          case 37: // ArrawLeft
            if (!(snake.direct & 1)) {
              snake.direct = 3;
            }
            break;
          case 38: // ArrowUp
            if (snake.direct & 1) {
              snake.direct = 0;
            }
            break;
          case 39: // ArrowRight
            if (!(snake.direct & 1)) {
              snake.direct = 1;
            }
            break;
          case 40: // ArrowDown
            if (snake.direct & 1) {
              snake.direct = 2;
            }
            break;
          default:
            break;
        }

        switch(event.keyCode) {
          case 37: // ArrawLeft
          case 38: // ArrowUp
          case 39: // ArrowRight
          case 40: // ArrowDown
            snake.pathQueue.push(Object.assign({}, snake.head));
            break;
          default:
            break;
        }
        isLock = true;
      }
    }
    switch(event.keyCode) {
      case 13: // enter
        start();
        break;
      case 27: // esc
        state = 3;
        break;
      default:
        break;
    }
  }

  return exports;
}(this));

snakeGame.init();
