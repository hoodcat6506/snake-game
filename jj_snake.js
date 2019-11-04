(function(exports) {
  var instance = exports.snakeGame = {
    init:        init,
    start:       start,
    restart:     restart,
    pause:       pause,
    end:         end,
    initSnake:   initSnake,
    renderSnake: renderSnake,
    addScore:    addScore,
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
  var board = (new Array(100)).fill(0).map((number, index) => index);

  function init() {
    state = 0;
    _cache();
    _bindEvent();
    _render();

    delete instance.init;
  }

  /**
   * start game
   */
  function start() {
    // start game
    state = 1;
    initSnake();
    renderSnake();
    initFruit();
    renderFruit();
    _renderFrame(0);
  }

  /**
   * restart game
   */
  function restart() {
    // restart game
    state = 1;
  }

  /**
   * pause game
   */
  function pause() {
    // pause game
    state = 2;
  }

  /**
   * end game
   */
  function end() {
    // end game
    alert('game over');
    state = 3;
  }

  /**
   * initialize snake data
   */
  function initSnake() {
    snake = {
      initBodyLength: 3,
      speed:          1,
      head:           {
        x:      1, // head x
        y:      5, // head y
        direct: 1, // 00: up, 01: right, 10: down, 11: left
      },
      bodyLocation:  [], // max 100(10x10)
      anglePosition: [], // path queue
    };
    for(var i = 0; i < snake.initBodyLength - 1; i++) {
      snake.head.x++;
      snake.bodyLocation.push(Object.assign({}, snake.head));
    }
    snake.head.x++;
  }

  /**
   * rendering snake's body on canvas
   */
  function renderSnake() {
    // var path = snake.head;
    var path = snake.bodyLocation[0]; // tail

    for (var i = 0; i < snake.anglePosition.length; i++) {
      _drawLine(path, snake.anglePosition[i]);
      path = snake.anglePosition[i];
    }

    _drawLine(path, snake.head);
  }

  /**
   * initialize fruit data
   */
  function initFruit() {
    var fruitLocation = null;
    var bodyLocation = snake.bodyLocation.map(body => (body.x * 10) + body.y);
    bodyLocation.push((snake.head.x * 10) + snake.head.y);
    var possible = board.filter(location => bodyLocation.indexOf(location) === -1);

    if (!possible.length) {
      end();
      return;
    }

    fruitLocation = possible[getRandomInt(0, possible.length)];
    fruit.x = ~~(fruitLocation / 10);
    fruit.y = ~~(fruitLocation % 10);
  }

  /**
   * rendering fruit on canvas
   */
  function renderFruit() {
    context.playZone.save();
    context.playZone.strokeStyle = '#ffdddd';
    context.playZone.fillStyle = '#ff0000';
    _drawDot(fruit);
    context.playZone.restore();
  }

  /**
   * add score
   */
  function addScore() {
    score += 10;
  }

  /**
   * speed up
   */
  function speedUp() {
    snake.speed = Math.max(0.1, snake.speed - 0.1);
  }

  /**
   * get random integer between min and max
   *
   * @param {number} min
   * @param {number} max
   */
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
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
    img.addEventListener('load', (event) => context.background.drawImage(event.target, 0, 0));
  }

  /**
   * loop
   *
   * @param {DOMHighResTimeStamp} timestamp
   */
  function _renderFrame(timestamp) {
    if (state === 1) {
      timeInfo.prevFrame = timeInfo.prevFrame || timestamp;

      if (timestamp - timeInfo.prevFrame >= 1000 * snake.speed) {
        _clearPlayZone();

        snake.bodyLocation.push(Object.assign({}, snake.head)); // add head
        // move head
        var zeroBit = (snake.head.direct & 1);
        var oneBit = ((snake.head.direct >>> 1) & 1);
        var incr = (zeroBit ^ oneBit) ? 1 : -1;
        (zeroBit ? snake.head.x += incr : snake.head.y += incr);

        // check path
        if (snake.anglePosition.length) {
          if (snake.anglePosition[0].x === snake.bodyLocation[0].x && snake.anglePosition[0].y === snake.bodyLocation[0].y) {
            snake.anglePosition.shift();
          }
        }

        if(_isGameOver()) {
          end();
          return;
        }

        // check if eat fruit
        if (snake.head.x === fruit.x && snake.head.y === fruit.y) {
          addScore();
          speedUp();
          initFruit();
        } else {
          snake.bodyLocation.shift(); // remove tail
        }

        timeInfo.prevFrame = timestamp;
        renderSnake();
        renderFruit();
        isLock = false;
      }
    }

    if (state === 3) {
      window.cancelAnimationFrame(_renderFrame);
      timeInfo.end = timestamp;
    } else {
      window.requestAnimationFrame(_renderFrame);
    }
  }

  function _isGameOver() {
    var headLocation = (snake.head.x * 10) + snake.head.y;
    var isCrush = snake.head.x > 9 || snake.head.x < 0 || snake.head.y > 9 || snake.head.y < 0;
    isCrush = isCrush || snake.bodyLocation.map(body => (body.x * 10) + body.y).indexOf(headLocation) !== -1;

    return isCrush;
  }

  function _drawDot(path) {
    context.playZone.fillRect(path.x * 30, path.y * 30, 30, 30);
  }

  /**
   * draw snake body by anglePosition
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
      if (direct >= 0) {
        if ((direct & 1) !== (snake.head.direct & 1)) {
          isLock = true;
          snake.head.direct = direct;
          snake.anglePosition.push(Object.assign({}, snake.head));
        }
      }
    }

    var handler = ({
      13: start,
      27: end
    })[event.keyCode];
    handler && handler();
  }

  return exports;
}(this));

snakeGame.init();
