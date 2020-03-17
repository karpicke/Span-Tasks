(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = function atoa (a, n) { return Array.prototype.slice.call(a, n); }

},{}],2:[function(require,module,exports){
'use strict';

var ticky = require('ticky');

module.exports = function debounce (fn, args, ctx) {
  if (!fn) { return; }
  ticky(function run () {
    fn.apply(ctx || null, args || []);
  });
};

},{"ticky":10}],3:[function(require,module,exports){
'use strict';

var atoa = require('atoa');
var debounce = require('./debounce');

module.exports = function emitter (thing, options) {
  var opts = options || {};
  var evt = {};
  if (thing === undefined) { thing = {}; }
  thing.on = function (type, fn) {
    if (!evt[type]) {
      evt[type] = [fn];
    } else {
      evt[type].push(fn);
    }
    return thing;
  };
  thing.once = function (type, fn) {
    fn._once = true; // thing.off(fn) still works!
    thing.on(type, fn);
    return thing;
  };
  thing.off = function (type, fn) {
    var c = arguments.length;
    if (c === 1) {
      delete evt[type];
    } else if (c === 0) {
      evt = {};
    } else {
      var et = evt[type];
      if (!et) { return thing; }
      et.splice(et.indexOf(fn), 1);
    }
    return thing;
  };
  thing.emit = function () {
    var args = atoa(arguments);
    return thing.emitterSnapshot(args.shift()).apply(this, args);
  };
  thing.emitterSnapshot = function (type) {
    var et = (evt[type] || []).slice(0);
    return function () {
      var args = atoa(arguments);
      var ctx = this || thing;
      if (type === 'error' && opts.throws !== false && !et.length) { throw args.length === 1 ? args[0] : args; }
      et.forEach(function emitter (listen) {
        if (opts.async) { debounce(listen, args, ctx); } else { listen.apply(ctx, args); }
        if (listen._once) { thing.off(type, listen); }
      });
      return thing;
    };
  };
  return thing;
};

},{"./debounce":2,"atoa":1}],4:[function(require,module,exports){
(function (global){
'use strict';

var customEvent = require('custom-event');
var eventmap = require('./eventmap');
var doc = global.document;
var addEvent = addEventEasy;
var removeEvent = removeEventEasy;
var hardCache = [];

if (!global.addEventListener) {
  addEvent = addEventHard;
  removeEvent = removeEventHard;
}

module.exports = {
  add: addEvent,
  remove: removeEvent,
  fabricate: fabricateEvent
};

function addEventEasy (el, type, fn, capturing) {
  return el.addEventListener(type, fn, capturing);
}

function addEventHard (el, type, fn) {
  return el.attachEvent('on' + type, wrap(el, type, fn));
}

function removeEventEasy (el, type, fn, capturing) {
  return el.removeEventListener(type, fn, capturing);
}

function removeEventHard (el, type, fn) {
  var listener = unwrap(el, type, fn);
  if (listener) {
    return el.detachEvent('on' + type, listener);
  }
}

function fabricateEvent (el, type, model) {
  var e = eventmap.indexOf(type) === -1 ? makeCustomEvent() : makeClassicEvent();
  if (el.dispatchEvent) {
    el.dispatchEvent(e);
  } else {
    el.fireEvent('on' + type, e);
  }
  function makeClassicEvent () {
    var e;
    if (doc.createEvent) {
      e = doc.createEvent('Event');
      e.initEvent(type, true, true);
    } else if (doc.createEventObject) {
      e = doc.createEventObject();
    }
    return e;
  }
  function makeCustomEvent () {
    return new customEvent(type, { detail: model });
  }
}

function wrapperFactory (el, type, fn) {
  return function wrapper (originalEvent) {
    var e = originalEvent || global.event;
    e.target = e.target || e.srcElement;
    e.preventDefault = e.preventDefault || function preventDefault () { e.returnValue = false; };
    e.stopPropagation = e.stopPropagation || function stopPropagation () { e.cancelBubble = true; };
    e.which = e.which || e.keyCode;
    fn.call(el, e);
  };
}

function wrap (el, type, fn) {
  var wrapper = unwrap(el, type, fn) || wrapperFactory(el, type, fn);
  hardCache.push({
    wrapper: wrapper,
    element: el,
    type: type,
    fn: fn
  });
  return wrapper;
}

function unwrap (el, type, fn) {
  var i = find(el, type, fn);
  if (i) {
    var wrapper = hardCache[i].wrapper;
    hardCache.splice(i, 1); // free up a tad of memory
    return wrapper;
  }
}

function find (el, type, fn) {
  var i, item;
  for (i = 0; i < hardCache.length; i++) {
    item = hardCache[i];
    if (item.element === el && item.type === type && item.fn === fn) {
      return i;
    }
  }
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./eventmap":5,"custom-event":6}],5:[function(require,module,exports){
(function (global){
'use strict';

var eventmap = [];
var eventname = '';
var ron = /^on/;

for (eventname in global) {
  if (ron.test(eventname)) {
    eventmap.push(eventname.slice(2));
  }
}

module.exports = eventmap;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],6:[function(require,module,exports){
(function (global){

var NativeCustomEvent = global.CustomEvent;

function useNative () {
  try {
    var p = new NativeCustomEvent('cat', { detail: { foo: 'bar' } });
    return  'cat' === p.type && 'bar' === p.detail.foo;
  } catch (e) {
  }
  return false;
}

/**
 * Cross-browser `CustomEvent` constructor.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent.CustomEvent
 *
 * @public
 */

module.exports = useNative() ? NativeCustomEvent :

// IE >= 9
'function' === typeof document.createEvent ? function CustomEvent (type, params) {
  var e = document.createEvent('CustomEvent');
  if (params) {
    e.initCustomEvent(type, params.bubbles, params.cancelable, params.detail);
  } else {
    e.initCustomEvent(type, false, false, void 0);
  }
  return e;
} :

// IE <= 8
function CustomEvent (type, params) {
  var e = document.createEventObject();
  e.type = type;
  if (params) {
    e.bubbles = Boolean(params.bubbles);
    e.cancelable = Boolean(params.cancelable);
    e.detail = params.detail;
  } else {
    e.bubbles = false;
    e.cancelable = false;
    e.detail = void 0;
  }
  return e;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
'use strict';

var cache = {};
var start = '(?:^|\\s)';
var end = '(?:\\s|$)';

function lookupClass (className) {
  var cached = cache[className];
  if (cached) {
    cached.lastIndex = 0;
  } else {
    cache[className] = cached = new RegExp(start + className + end, 'g');
  }
  return cached;
}

function addClass (el, className) {
  var current = el.className;
  if (!current.length) {
    el.className = className;
  } else if (!lookupClass(className).test(current)) {
    el.className += ' ' + className;
  }
}

function rmClass (el, className) {
  el.className = el.className.replace(lookupClass(className), ' ').trim();
}

module.exports = {
  add: addClass,
  rm: rmClass
};

},{}],8:[function(require,module,exports){
(function (global){
'use strict';

var emitter = require('contra/emitter');
var crossvent = require('crossvent');
var classes = require('./classes');
var doc = document;
var documentElement = doc.documentElement;

function dragula (initialContainers, options) {
  var len = arguments.length;
  if (len === 1 && Array.isArray(initialContainers) === false) {
    options = initialContainers;
    initialContainers = [];
  }
  var _mirror; // mirror image
  var _source; // source container
  var _item; // item being dragged
  var _offsetX; // reference x
  var _offsetY; // reference y
  var _moveX; // reference move x
  var _moveY; // reference move y
  var _initialSibling; // reference sibling when grabbed
  var _currentSibling; // reference sibling now
  var _copy; // item used for copying
  var _renderTimer; // timer for setTimeout renderMirrorImage
  var _lastDropTarget = null; // last container item was over
  var _grabbed; // holds mousedown context until first mousemove

  var o = options || {};
  if (o.moves === void 0) { o.moves = always; }
  if (o.accepts === void 0) { o.accepts = always; }
  if (o.invalid === void 0) { o.invalid = invalidTarget; }
  if (o.containers === void 0) { o.containers = initialContainers || []; }
  if (o.isContainer === void 0) { o.isContainer = never; }
  if (o.copy === void 0) { o.copy = false; }
  if (o.copySortSource === void 0) { o.copySortSource = false; }
  if (o.revertOnSpill === void 0) { o.revertOnSpill = false; }
  if (o.removeOnSpill === void 0) { o.removeOnSpill = false; }
  if (o.direction === void 0) { o.direction = 'vertical'; }
  if (o.ignoreInputTextSelection === void 0) { o.ignoreInputTextSelection = true; }
  if (o.mirrorContainer === void 0) { o.mirrorContainer = doc.body; }

  var drake = emitter({
    containers: o.containers,
    start: manualStart,
    end: end,
    cancel: cancel,
    remove: remove,
    destroy: destroy,
    canMove: canMove,
    dragging: false
  });

  if (o.removeOnSpill === true) {
    drake.on('over', spillOver).on('out', spillOut);
  }

  events();

  return drake;

  function isContainer (el) {
    return drake.containers.indexOf(el) !== -1 || o.isContainer(el);
  }

  function events (remove) {
    var op = remove ? 'remove' : 'add';
    touchy(documentElement, op, 'mousedown', grab);
    touchy(documentElement, op, 'mouseup', release);
  }

  function eventualMovements (remove) {
    var op = remove ? 'remove' : 'add';
    touchy(documentElement, op, 'mousemove', startBecauseMouseMoved);
  }

  function movements (remove) {
    var op = remove ? 'remove' : 'add';
    crossvent[op](documentElement, 'selectstart', preventGrabbed); // IE8
    crossvent[op](documentElement, 'click', preventGrabbed);
  }

  function destroy () {
    events(true);
    release({});
  }

  function preventGrabbed (e) {
    if (_grabbed) {
      e.preventDefault();
    }
  }

  function grab (e) {
    _moveX = e.clientX;
    _moveY = e.clientY;

    var ignore = whichMouseButton(e) !== 1 || e.metaKey || e.ctrlKey;
    if (ignore) {
      return; // we only care about honest-to-god left clicks and touch events
    }
    var item = e.target;
    var context = canStart(item);
    if (!context) {
      return;
    }
    _grabbed = context;
    eventualMovements();
    if (e.type === 'mousedown') {
      if (isInput(item)) { // see also: https://github.com/bevacqua/dragula/issues/208
        item.focus(); // fixes https://github.com/bevacqua/dragula/issues/176
      } else {
        e.preventDefault(); // fixes https://github.com/bevacqua/dragula/issues/155
      }
    }
  }

  function startBecauseMouseMoved (e) {
    if (!_grabbed) {
      return;
    }
    if (whichMouseButton(e) === 0) {
      release({});
      return; // when text is selected on an input and then dragged, mouseup doesn't fire. this is our only hope
    }
    // truthy check fixes #239, equality fixes #207
    if (e.clientX !== void 0 && e.clientX === _moveX && e.clientY !== void 0 && e.clientY === _moveY) {
      return;
    }
    if (o.ignoreInputTextSelection) {
      var clientX = getCoord('clientX', e);
      var clientY = getCoord('clientY', e);
      var elementBehindCursor = doc.elementFromPoint(clientX, clientY);
      if (isInput(elementBehindCursor)) {
        return;
      }
    }

    var grabbed = _grabbed; // call to end() unsets _grabbed
    eventualMovements(true);
    movements();
    end();
    start(grabbed);

    var offset = getOffset(_item);
    _offsetX = getCoord('pageX', e) - offset.left;
    _offsetY = getCoord('pageY', e) - offset.top;

    classes.add(_copy || _item, 'gu-transit');
    renderMirrorImage();
    drag(e);
  }

  function canStart (item) {
    if (drake.dragging && _mirror) {
      return;
    }
    if (isContainer(item)) {
      return; // don't drag container itself
    }
    var handle = item;
    while (getParent(item) && isContainer(getParent(item)) === false) {
      if (o.invalid(item, handle)) {
        return;
      }
      item = getParent(item); // drag target should be a top element
      if (!item) {
        return;
      }
    }
    var source = getParent(item);
    if (!source) {
      return;
    }
    if (o.invalid(item, handle)) {
      return;
    }

    var movable = o.moves(item, source, handle, nextEl(item));
    if (!movable) {
      return;
    }

    return {
      item: item,
      source: source
    };
  }

  function canMove (item) {
    return !!canStart(item);
  }

  function manualStart (item) {
    var context = canStart(item);
    if (context) {
      start(context);
    }
  }

  function start (context) {
    if (isCopy(context.item, context.source)) {
      _copy = context.item.cloneNode(true);
      drake.emit('cloned', _copy, context.item, 'copy');
    }

    _source = context.source;
    _item = context.item;
    _initialSibling = _currentSibling = nextEl(context.item);

    drake.dragging = true;
    drake.emit('drag', _item, _source);
  }

  function invalidTarget () {
    return false;
  }

  function end () {
    if (!drake.dragging) {
      return;
    }
    var item = _copy || _item;
    drop(item, getParent(item));
  }

  function ungrab () {
    _grabbed = false;
    eventualMovements(true);
    movements(true);
  }

  function release (e) {
    ungrab();

    if (!drake.dragging) {
      return;
    }
    var item = _copy || _item;
    var clientX = getCoord('clientX', e);
    var clientY = getCoord('clientY', e);
    var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
    var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
    if (dropTarget && ((_copy && o.copySortSource) || (!_copy || dropTarget !== _source))) {
      drop(item, dropTarget);
    } else if (o.removeOnSpill) {
      remove();
    } else {
      cancel();
    }
  }

  function drop (item, target) {
    var parent = getParent(item);
    if (_copy && o.copySortSource && target === _source) {
      parent.removeChild(_item);
    }
    if (isInitialPlacement(target)) {
      drake.emit('cancel', item, _source, _source);
    } else {
      drake.emit('drop', item, target, _source, _currentSibling);
    }
    cleanup();
  }

  function remove () {
    if (!drake.dragging) {
      return;
    }
    var item = _copy || _item;
    var parent = getParent(item);
    if (parent) {
      parent.removeChild(item);
    }
    drake.emit(_copy ? 'cancel' : 'remove', item, parent, _source);
    cleanup();
  }

  function cancel (revert) {
    if (!drake.dragging) {
      return;
    }
    var reverts = arguments.length > 0 ? revert : o.revertOnSpill;
    var item = _copy || _item;
    var parent = getParent(item);
    var initial = isInitialPlacement(parent);
    if (initial === false && reverts) {
      if (_copy) {
        if (parent) {
          parent.removeChild(_copy);
        }
      } else {
        _source.insertBefore(item, _initialSibling);
      }
    }
    if (initial || reverts) {
      drake.emit('cancel', item, _source, _source);
    } else {
      drake.emit('drop', item, parent, _source, _currentSibling);
    }
    cleanup();
  }

  function cleanup () {
    var item = _copy || _item;
    ungrab();
    removeMirrorImage();
    if (item) {
      classes.rm(item, 'gu-transit');
    }
    if (_renderTimer) {
      clearTimeout(_renderTimer);
    }
    drake.dragging = false;
    if (_lastDropTarget) {
      drake.emit('out', item, _lastDropTarget, _source);
    }
    drake.emit('dragend', item);
    _source = _item = _copy = _initialSibling = _currentSibling = _renderTimer = _lastDropTarget = null;
  }

  function isInitialPlacement (target, s) {
    var sibling;
    if (s !== void 0) {
      sibling = s;
    } else if (_mirror) {
      sibling = _currentSibling;
    } else {
      sibling = nextEl(_copy || _item);
    }
    return target === _source && sibling === _initialSibling;
  }

  function findDropTarget (elementBehindCursor, clientX, clientY) {
    var target = elementBehindCursor;
    while (target && !accepted()) {
      target = getParent(target);
    }
    return target;

    function accepted () {
      var droppable = isContainer(target);
      if (droppable === false) {
        return false;
      }

      var immediate = getImmediateChild(target, elementBehindCursor);
      var reference = getReference(target, immediate, clientX, clientY);
      var initial = isInitialPlacement(target, reference);
      if (initial) {
        return true; // should always be able to drop it right back where it was
      }
      return o.accepts(_item, target, _source, reference);
    }
  }

  function drag (e) {
    if (!_mirror) {
      return;
    }
    e.preventDefault();

    var clientX = getCoord('clientX', e);
    var clientY = getCoord('clientY', e);
    var x = clientX - _offsetX;
    var y = clientY - _offsetY;

    _mirror.style.left = x + 'px';
    _mirror.style.top = y + 'px';

    var item = _copy || _item;
    var elementBehindCursor = getElementBehindPoint(_mirror, clientX, clientY);
    var dropTarget = findDropTarget(elementBehindCursor, clientX, clientY);
    var changed = dropTarget !== null && dropTarget !== _lastDropTarget;
    if (changed || dropTarget === null) {
      out();
      _lastDropTarget = dropTarget;
      over();
    }
    var parent = getParent(item);
    if (dropTarget === _source && _copy && !o.copySortSource) {
      if (parent) {
        parent.removeChild(item);
      }
      return;
    }
    var reference;
    var immediate = getImmediateChild(dropTarget, elementBehindCursor);
    if (immediate !== null) {
      reference = getReference(dropTarget, immediate, clientX, clientY);
    } else if (o.revertOnSpill === true && !_copy) {
      reference = _initialSibling;
      dropTarget = _source;
    } else {
      if (_copy && parent) {
        parent.removeChild(item);
      }
      return;
    }
    if (
      (reference === null && changed) ||
      reference !== item &&
      reference !== nextEl(item)
    ) {
      _currentSibling = reference;
      dropTarget.insertBefore(item, reference);
      drake.emit('shadow', item, dropTarget, _source);
    }
    function moved (type) { drake.emit(type, item, _lastDropTarget, _source); }
    function over () { if (changed) { moved('over'); } }
    function out () { if (_lastDropTarget) { moved('out'); } }
  }

  function spillOver (el) {
    classes.rm(el, 'gu-hide');
  }

  function spillOut (el) {
    if (drake.dragging) { classes.add(el, 'gu-hide'); }
  }

  function renderMirrorImage () {
    if (_mirror) {
      return;
    }
    var rect = _item.getBoundingClientRect();
    _mirror = _item.cloneNode(true);
    _mirror.style.width = getRectWidth(rect) + 'px';
    _mirror.style.height = getRectHeight(rect) + 'px';
    classes.rm(_mirror, 'gu-transit');
    classes.add(_mirror, 'gu-mirror');
    o.mirrorContainer.appendChild(_mirror);
    touchy(documentElement, 'add', 'mousemove', drag);
    classes.add(o.mirrorContainer, 'gu-unselectable');
    drake.emit('cloned', _mirror, _item, 'mirror');
  }

  function removeMirrorImage () {
    if (_mirror) {
      classes.rm(o.mirrorContainer, 'gu-unselectable');
      touchy(documentElement, 'remove', 'mousemove', drag);
      getParent(_mirror).removeChild(_mirror);
      _mirror = null;
    }
  }

  function getImmediateChild (dropTarget, target) {
    var immediate = target;
    while (immediate !== dropTarget && getParent(immediate) !== dropTarget) {
      immediate = getParent(immediate);
    }
    if (immediate === documentElement) {
      return null;
    }
    return immediate;
  }

  function getReference (dropTarget, target, x, y) {
    var horizontal = o.direction === 'horizontal';
    var reference = target !== dropTarget ? inside() : outside();
    return reference;

    function outside () { // slower, but able to figure out any position
      var len = dropTarget.children.length;
      var i;
      var el;
      var rect;
      for (i = 0; i < len; i++) {
        el = dropTarget.children[i];
        rect = el.getBoundingClientRect();
        if (horizontal && (rect.left + rect.width / 2) > x) { return el; }
        if (!horizontal && (rect.top + rect.height / 2) > y) { return el; }
      }
      return null;
    }

    function inside () { // faster, but only available if dropped inside a child element
      var rect = target.getBoundingClientRect();
      if (horizontal) {
        return resolve(x > rect.left + getRectWidth(rect) / 2);
      }
      return resolve(y > rect.top + getRectHeight(rect) / 2);
    }

    function resolve (after) {
      return after ? nextEl(target) : target;
    }
  }

  function isCopy (item, container) {
    return typeof o.copy === 'boolean' ? o.copy : o.copy(item, container);
  }
}

function touchy (el, op, type, fn) {
  var touch = {
    mouseup: 'touchend',
    mousedown: 'touchstart',
    mousemove: 'touchmove'
  };
  var pointers = {
    mouseup: 'pointerup',
    mousedown: 'pointerdown',
    mousemove: 'pointermove'
  };
  var microsoft = {
    mouseup: 'MSPointerUp',
    mousedown: 'MSPointerDown',
    mousemove: 'MSPointerMove'
  };
  if (global.navigator.pointerEnabled) {
    crossvent[op](el, pointers[type], fn);
  } else if (global.navigator.msPointerEnabled) {
    crossvent[op](el, microsoft[type], fn);
  } else {
    crossvent[op](el, touch[type], fn);
    crossvent[op](el, type, fn);
  }
}

function whichMouseButton (e) {
  if (e.touches !== void 0) { return e.touches.length; }
  if (e.which !== void 0 && e.which !== 0) { return e.which; } // see https://github.com/bevacqua/dragula/issues/261
  if (e.buttons !== void 0) { return e.buttons; }
  var button = e.button;
  if (button !== void 0) { // see https://github.com/jquery/jquery/blob/99e8ff1baa7ae341e94bb89c3e84570c7c3ad9ea/src/event.js#L573-L575
    return button & 1 ? 1 : button & 2 ? 3 : (button & 4 ? 2 : 0);
  }
}

function getOffset (el) {
  var rect = el.getBoundingClientRect();
  return {
    left: rect.left + getScroll('scrollLeft', 'pageXOffset'),
    top: rect.top + getScroll('scrollTop', 'pageYOffset')
  };
}

function getScroll (scrollProp, offsetProp) {
  if (typeof global[offsetProp] !== 'undefined') {
    return global[offsetProp];
  }
  if (documentElement.clientHeight) {
    return documentElement[scrollProp];
  }
  return doc.body[scrollProp];
}

function getElementBehindPoint (point, x, y) {
  var p = point || {};
  var state = p.className;
  var el;
  p.className += ' gu-hide';
  el = doc.elementFromPoint(x, y);
  p.className = state;
  return el;
}

function never () { return false; }
function always () { return true; }
function getRectWidth (rect) { return rect.width || (rect.right - rect.left); }
function getRectHeight (rect) { return rect.height || (rect.bottom - rect.top); }
function getParent (el) { return el.parentNode === doc ? null : el.parentNode; }
function isInput (el) { return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || isEditable(el); }
function isEditable (el) {
  if (!el) { return false; } // no parents were editable
  if (el.contentEditable === 'false') { return false; } // stop the lookup
  if (el.contentEditable === 'true') { return true; } // found a contentEditable element in the chain
  return isEditable(getParent(el)); // contentEditable is set to 'inherit'
}

function nextEl (el) {
  return el.nextElementSibling || manually();
  function manually () {
    var sibling = el;
    do {
      sibling = sibling.nextSibling;
    } while (sibling && sibling.nodeType !== 1);
    return sibling;
  }
}

function getEventHost (e) {
  // on touchend event, we have to use `e.changedTouches`
  // see http://stackoverflow.com/questions/7192563/touchend-event-properties
  // see https://github.com/bevacqua/dragula/issues/34
  if (e.targetTouches && e.targetTouches.length) {
    return e.targetTouches[0];
  }
  if (e.changedTouches && e.changedTouches.length) {
    return e.changedTouches[0];
  }
  return e;
}

function getCoord (coord, e) {
  var host = getEventHost(e);
  var missMap = {
    pageX: 'clientX', // IE8
    pageY: 'clientY' // IE8
  };
  if (coord in missMap && !(coord in host) && missMap[coord] in host) {
    coord = missMap[coord];
  }
  return host[coord];
}

module.exports = dragula;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./classes":7,"contra/emitter":3,"crossvent":4}],9:[function(require,module,exports){
module.exports = {
	compareTwoStrings,
	findBestMatch
};

function compareTwoStrings (str1, str2) {
	if (!str1.length && !str2.length) return 1;                    // if both are empty strings
	if (!str1.length || !str2.length) return 0;                    // if only one is empty string
	if (str1.toUpperCase() === str2.toUpperCase()) return 1;       // identical
	if (str1.length === 1 && str2.length === 1) return 0;          // both are 1-letter strings

	const pairs1 = wordLetterPairs(str1);
	const pairs2 = wordLetterPairs(str2);
	const union = pairs1.length + pairs2.length;
	let intersection = 0;
	pairs1.forEach(pair1 => {
		for (let i = 0, pair2; pair2 = pairs2[i]; i++) {
			if (pair1 !== pair2) continue;
			intersection++;
			pairs2.splice(i, 1);
			break;
		}
	});
	return intersection * 2 / union;
}

function findBestMatch (mainString, targetStrings) {
	if (!areArgsValid(mainString, targetStrings)) throw new Error('Bad arguments: First argument should be a string, second should be an array of strings');
	const ratings = targetStrings.map(target => ({ target, rating: compareTwoStrings(mainString, target) }));
	const bestMatch = Array.from(ratings).sort((a, b) => b.rating - a.rating)[0];
	return { ratings, bestMatch };
}

function flattenDeep (arr) {
	return Array.isArray(arr) ? arr.reduce((a, b) => a.concat(flattenDeep(b)) , []) : [arr];
}

function areArgsValid (mainString, targetStrings) {
	if (typeof mainString !== 'string') return false;
	if (!Array.isArray(targetStrings)) return false;
	if (!targetStrings.length) return false;
	if (targetStrings.find(s => typeof s !== 'string')) return false;
	return true;
}

function letterPairs (str) {
	const pairs = [];
	for (let i = 0, max = str.length - 1; i < max; i++) pairs[i] = str.substring(i, i + 2);
	return pairs;
}

function wordLetterPairs (str) {
	const pairs = str.toUpperCase().split(' ').map(letterPairs);
	return flattenDeep(pairs);
}

},{}],10:[function(require,module,exports){
(function (setImmediate){
var si = typeof setImmediate === 'function', tick;
if (si) {
  tick = function (fn) { setImmediate(fn); };
} else {
  tick = function (fn) { setTimeout(fn, 0); };
}

module.exports = tick;
}).call(this,require("timers").setImmediate)

},{"timers":36}],11:[function(require,module,exports){
(function() {
  function getBytes() {
    try {
      // Modern Browser
      return Array.from(
        (window.crypto || window.msCrypto).getRandomValues(new Uint8Array(16))
      );
    } catch (error) {
      // Legacy Browser, fallback to Math.random
      var ret = [];
      while (ret.length < 16) ret.push((Math.random() * 256) & 0xff);
      return ret;
    }
  }

  function m(v) {
    v = v.toString(16);
    if (v.length < 2) v = "0" + v;
    return v;
  }

  function genUUID() {
    var rnd = getBytes();
    rnd[6] = (rnd[6] & 0x0f) | 0x40;
    rnd[8] = (rnd[8] & 0x3f) | 0x80;
    rnd = rnd
      .map(m)
      .join("")
      .match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
    rnd.shift();
    return rnd.join("-");
  }

  var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  function isUUID(uuid) {
    return uuidPattern.test(uuid);
  }

  genUUID.valid = isUUID;

  // global
  if (window) {
    window.uuid4 = genUUID;
  }

  // Node-style CJS
  if (typeof module !== "undefined" && module.exports) {
    module.exports = genUUID;
  }

  // AMD - legacy
  if (typeof define === "function" && define.amd) {
    define([], function() {
      return genUUID;
    });
  }
})();

},{}],12:[function(require,module,exports){
const getButtonColorClass = require('./constants').getButtonColorClass
class NextButton {
	constructor(text) {
		const buttonText = text || 'Next'

		return $('<button>', {
			class: `btn ${getButtonColorClass()} waves-effect waves-light`,
			text: buttonText
		})
	}
}

module.exports.NextButton = NextButton

class IDKButton {
	constructor(dataInstance) {
		this._data = dataInstance

		const $button = $('<button>', {
			class: 'btn btn-secondary waves-effect waves-light',
			text: "I don't know"
		})
		$button.click(() => this._populateInput())

		return $button
	}

	_populateInput() {
		const $inputs = $('input[type=text], textarea')
		$inputs.each(function () {
			const $input = $(this)
			if (!$input.val() && !$input.hasClass('pcllab-hp-input')) {
				$input.val("I don't know")
				$input.trigger(jQuery.Event('keyup'))
				$input.trigger(jQuery.Event('keydown'))
				$input.trigger(jQuery.Event('keypress'))
			}
		})
		this._data.registerButtonPress()
	}
}

module.exports.IDKButton = IDKButton

class RepeatButton {
	constructor(dataInstance) {
		this._data = dataInstance

		return $('<button>', {
			class: `btn ${getButtonColorClass()} waves-effect waves-light`,
			text: 'Repeat',
			id: 'repeat_button',
			click: this.onClick()
		})
	}

	onClick() {
		return () => {
			const audio = $('#audio_element')[0]
			audio.currentTime = 0
			audio.play()
			this._data.registerKeyPress()
		}
	}
}

module.exports.RepeatButton = RepeatButton
},{"./constants":13}],13:[function(require,module,exports){
module.exports.RESPONSE_ALIGNMENT = {
	left: 'left',
	center: 'center',
	right: 'right'
}

module.exports.CUE_ALIGNMENT = {
	horizontal: 'horizontal',
	vertical: 'vertical'
}

module.exports.SCORING_STRATEGY = {
	dice: 'dice',
	exact: 'exact',
	ultron: 'ultron'
}

module.exports.INPUT_SIZE = {
	small: 'small',
	medium: 'medium',
	large: 'large',
	xlarge: 'xlarge'
}

module.exports.RESPONSE_TYPE = {
	input: 'input',
	study_items: 'study_items',
	free_recall: 'free_recall',
	slider: 'slider',
	checkbox: 'checkbox',
	radio: 'radio',
	button: 'button'
}

let buttonColorClass = 'btn-primary'

module.exports.getButtonColorClass = () => {
	return buttonColorClass
}

module.exports.setButtonColorClass = (newButtonClass) => {
	buttonColorClass = newButtonClass
}
},{}],14:[function(require,module,exports){
const uuid4 = require('uuid4')
const Data = require('./data')
const ProgressBar = require('./progressBar').ProgressBar
const TotalProgressBar = require('./progressBar').TotalProgressBar
const ForcedResponseHandler = require('./handlers/forcedResponseHandler')

// Buttons
const NextButton = require('./buttons').NextButton
const IDKButton = require('./buttons').IDKButton
const RepeatButton = require('./buttons').RepeatButton

// Constants
const Constants = require('./constants')
const RESPONSE_TYPE = require('./constants').RESPONSE_TYPE
const RESPONSE_ALIGNMENT = require('./constants').RESPONSE_ALIGNMENT
const CUE_ALIGNMENT = require('./constants').CUE_ALIGNMENT
const SCORING_STRATEGY = require('./constants').SCORING_STRATEGY
const INPUT_SIZE = require('./constants').INPUT_SIZE

// Util
const setParameter = require('./util').setParameter
const setParameterFromConstants = require('./util').setParameterFromConstants
const $hide = require('./util').$hide
const $show = require('./util').$show
const setInterval = require('./util').setInterval
const setTimeout = require('./util').setTimeout
const clearAllTimers = require('./util').clearAllTimers
const compareResponse = require('./util').compareResponse

// Views
const RecallStandardView = require('./views/recall/standardView')
const RecallHorizontalView = require('./views/recall/horizontalView')
const RecallWordBankView = require('./views/recall/wordBankView')
const ResponseInputView = require('./views/response/inputView')
const ResponseSliderView = require('./views/response/sliderView')
const ResponseRadioView = require('./views/response/radioView')
const ResponseButtonView = require('./views/response/buttonView')
const ResponseFreeRecallView = require('./views/response/freeRecallView')

/**
 * @name Core
 * 
 * @param {string} 			[title]
 * @param {string}			[button_text]
 * @param {string}			[input_size]
 * @param {number} 			[response_count]
 * @param {number}			[isi_time]
 * @param {object}			stimuli
 * @param {object}			[stimulus_file]
 * 
 * @author Vishnu Vijayan
 */

class Core {
	constructor(display_element, trial) {
		if (!display_element) {
			throw new Error("Invalid display element", display_element)
		}

		if (!trial) {
			throw new Error("Invalid trial", trial)
		}

		if (!trial.stimuli && !trial.stimulus_file) {
			throw new Error("Invalid trial stimulus", trial.stimuli)
		}

		// Plugin parameters
		this.trial = trial
		this.stimuli = setParameter(trial.stimuli, [], null)
		this.randomize = setParameter(trial.randomize, false, 'boolean')

		// Feedback parameters
		this.feedback = setParameter(trial.feedback, false, 'boolean')
		this.feedback_html = setParameter(trial.feedback_html, null, 'function')
		this.correct_feedback = setParameter(trial.correct_feedback, false, 'boolean')
		this.correct_feedback_time = setParameter(trial.correct_feedback_time, 1500, 'number')

		// Stimulus parameters
		this.title = setParameter(trial.title, '', null)
		this.button_text = setParameter(trial.button_text, 'Next', null)
		this.input_size = setParameter(trial.input_size, INPUT_SIZE.medium, 'string')
		this.show_button = setParameter(trial.show_button, false, 'boolean')
		this.show_i_dont_know = setParameter(trial.show_i_dont_know, false, 'boolean')
		this.show_repeat = setParameter(trial.show_repeat, false, 'boolean')
		this.show_repeat_minimum_time = setParameter(trial.show_repeat_minimum_time, 0, 'number')
		this.forced_response = setParameter(trial.forced_response, false, 'boolean')
		this.response_count = setParameter(trial.response_count, 1, 'number')
		this.response_box_align = setParameter(trial.response_box_align, RESPONSE_ALIGNMENT.center, 'string').toLowerCase()
		this.cue_alignment = setParameter(trial.cue_align, CUE_ALIGNMENT.vertical, 'string').toLowerCase()
		this.word_bank_alignment = setParameter(trial.word_bank_alignm, CUE_ALIGNMENT.vertical, 'string').toLowerCase()

		// Timing parameters
		this.isi_time = setParameter(trial.isi_time || trial.isi, 500, 'number')
		this.minimum_time = setParameter(trial.minimum_time, 0, 'number')
		this.maximum_time = setParameter(trial.maximum_time, 3000, 'number')
		this.show_progress = setParameter(trial.show_progress, false, 'boolean')
		this.progress_total_time = setParameter(trial.progress_total_time, false, 'boolean')

		// Scoring parameters
		this.scoringStrategy = setParameterFromConstants(trial.scoring_strategy, SCORING_STRATEGY, null, 'string')
		this.scoringParams = setParameter(trial.scoring_params, null, null)

		// Hook functions
		this.on_stimulus_start = setParameter(trial.on_stimulus_start, () => { }, 'function')
		this.on_stimulus_end = setParameter(trial.on_stimulus_end, () => { }, 'function')
		this.done_callback = setParameter(trial.done_callback, () => { }, 'function')


		// Template properties
		this.$display_element = $(display_element)
		this.$trial_container = null
		this.$progress_container = null
		this.$title = $()
		this.$button_container = null
		this.$repeatButton = null

		// Internal properties
		this._stimuliList = this.stimuli.slice().reverse()
		this._completedStimuliList = []
		this._data = new Data(this)
		this._forcedResponseHandler = new ForcedResponseHandler()
		this._totalProgressBar = null

		// Set default button color
		const oldButtonColor = Constants.getButtonColorClass()
		const newButtonColor = setParameter(trial.button_color_class, oldButtonColor, 'string')
		Constants.setButtonColorClass(newButtonColor)

		this.buildTemplate()
	}

	start() {
		if (this.trial.stimulus_file) {
			const self = this
			$.getJSON(self.trial.stimulus_file, (data) => {
				self.stimuli = data
				self._stimuliList = self.stimuli.slice().reverse()
				self._start()
			})
		} else {
			this._start()
		}
	}

	_start() {
		// Randomize stimuli if necessary
		if (this.randomize) {
			this._stimuliList = jsPsych.randomization.shuffle(this.stimuli).reverse()
		}

		// Render the total progress bar
		if (this.progress_total_time && this.show_progress) {
			this._totalProgressBar = new TotalProgressBar(this)
			this.$progress_container.append(this._totalProgressBar.get$Element())
			this._totalProgressBar.start()
		}

		this.on_stimulus_start(this.pluginAPI)
		const stimulus = this._stimuliList.pop()
		this.showRecall(stimulus)
	}

	showRecall(stimulus) {
		clearAllTimers()

		stimulus._id = setParameter(stimulus._id, uuid4(), 'string')

		this.$trial_container.empty()
		this.$button_container.empty()
		this.$title.hide()

		if (!this.progress_total_time) {
			this.$progress_container.empty()
		}

		// Start data logging
		this._data.startRecall({
			cue: stimulus.cue,
			cue_list: stimulus.cue_list,
			target: stimulus.target,
			target_list: stimulus.target_list,
			type: stimulus.type,
			metadata: stimulus.data
		})

		// Do not record cue data if feedback is showing
		if (stimulus._feedback) {
			this._data.currentDataBlock.cue = 'Feedback'
			this._data.currentDataBlock.cue_list = undefined
		}

		let view = null
		if (this.cue_alignment === CUE_ALIGNMENT.horizontal) {
			view = new RecallHorizontalView(stimulus)
		} else {
			view = new RecallStandardView(stimulus)
		}

		view.appendTo(this.$trial_container)

		// Where response inputs go
		let $responsePanel = this.$trial_container
		// Where the word bank goes
		let $wordBankPanel = this.$trial_container

		if (stimulus.word_list && this.word_bank_alignment === CUE_ALIGNMENT.vertical) {
			const $row = $('<div>', { class: 'row mt-2 mb-2' })
			$responsePanel = $('<div>', { class: 'col-8' })
			$wordBankPanel = $('<div>', { class: 'col-4' })

			$row.append($responsePanel)
			$row.append($wordBankPanel)

			this.$trial_container.append($row)
		}

		// Set title
		if (stimulus.title) {
			this.$title.find('h1').text(stimulus.title)
			this.$title.show()
		} else if (this.title) {
			this.$title.find('h1').text(this.title)
			this.$title.show()
		}

		// Render response containers
		const responseViewType = setParameter(stimulus.response_type, RESPONSE_TYPE.input, 'string')
		let responseView = null
		switch (responseViewType) {
			case RESPONSE_TYPE.slider: {
				responseView = new ResponseSliderView($responsePanel, this, this._data, stimulus)
				break
			}

			case RESPONSE_TYPE.radio: {
				responseView = new ResponseRadioView($responsePanel, this, this._data, stimulus)
				break
			}

			case RESPONSE_TYPE.study_items: {
				responseView = new ResponseInputView($responsePanel, this, this._data, stimulus)
				break
			}

			case RESPONSE_TYPE.button: {
				responseView = new ResponseButtonView($responsePanel, this, this._data, stimulus)
				break
			}

			case RESPONSE_TYPE.free_recall: {
				responseView = new ResponseFreeRecallView($responsePanel, this, this._data, stimulus)
				break
			}

			default: {
				responseView = new ResponseInputView($responsePanel, this, this._data, stimulus)
			}
		}
		responseView.render()

		// Render word bank
		if (stimulus.word_list) {
			const wordBank = new RecallWordBankView(stimulus, this.word_bank_alignment)
			wordBank.appendTo($wordBankPanel)
			wordBank.attachInputs(responseView.responseContainers)
		}

		// Render next button
		const buttonText = setParameter(stimulus.button_text, this.button_text, 'string')
		const forcedResponse = responseViewType === RESPONSE_TYPE.button ? true : setParameter(stimulus.forced_response, this.forced_response, 'boolean')
		const nextButton = new NextButton(buttonText)
		nextButton.click(() => {
			nextButton.prop('disabled', true)
			this._endRecall(stimulus, responseView.responseContainers)
		})

		if (forcedResponse) {
			this._forcedResponseHandler.register(nextButton, responseView)
		}

		// Repeat button
		const showRepeat = setParameter(stimulus.show_repeat, this.show_repeat, 'boolean')
		const showRepeatMinimumTime = setParameter(stimulus.show_repeat_minimum_time, this.show_repeat_minimum_time, 'number')
		if (showRepeat && stimulus.audio_file) {
			this.$repeatButton = new RepeatButton(this._data)
			this.$button_container.append(this.$repeatButton)
			this.$repeatButton.hide()

			setTimeout(() => this.$repeatButton.show(), showRepeatMinimumTime)
		}

		// Show I don't know button
		const showIDK = setParameter(stimulus.show_i_dont_know, this.show_i_dont_know, 'boolean')
		if (showIDK) {
			const idkButton = new IDKButton(this._data)
			this.$button_container.append(idkButton)
		}

		// Wait before showing button
		const minimumTime = setParameter(stimulus.minimum_time, this.minimum_time, 'number')
		const maximumTime = setParameter(stimulus.maximum_time, this.maximum_time, 'number')
		const showButton = setParameter(stimulus.show_button, this.show_button, 'boolean')
		if (showButton || responseViewType === RESPONSE_TYPE.button) {
			const self = this
			if (this.trial.maximum_time) {
				setTimeout(() => this._endRecall(stimulus, responseView.responseContainers), maximumTime)
			}

			if (this.show_progress && !this.progress_total_time) {
				const progressBar = new ProgressBar(minimumTime)
				this.$progress_container.append(progressBar.get$Element())
				progressBar.done(() => {
					this.$button_container.append(nextButton)
					this.$progress_container.empty()
				})
				progressBar.start()
			} else {
				// Progress the total progress bar for self-paced experiments
				if (this.progress_total_time) {
					this._totalProgressBar.progressByTime(minimumTime)
				}
				setTimeout(() => {
					self.$button_container.append(nextButton)
				}, minimumTime)
			}
		} else {
			// Automatically advance the trial
			if (this.show_progress && !this.progress_total_time) {
				const progressBar = new ProgressBar(maximumTime)
				this.$progress_container.append(progressBar.get$Element())
				progressBar.done(() => this._endRecall(stimulus, responseView.responseContainers))
				progressBar.start()
			} else {
				setTimeout(() => this._endRecall(stimulus, responseView.responseContainers), maximumTime)
			}
		}
	}

	_endRecall(stimulus, responseContainers) {
		// End data logging
		responseContainers.forEach(responseContainer => responseContainer.saveResponse())
		// responseContainers.forEach(responseContainer => responseContainer.remove())
		this._data.endRecall()
		this._completedStimuliList.push(stimulus)
		this.on_stimulus_end(this.pluginAPI, stimulus)

		// Correct feedback
		let correctFeedback = setParameter(stimulus.correct_feedback, this.correct_feedback, 'boolean')
		const datablock = this._data.getDataBlocks().pop()
		const showCorrectFeedback = correctFeedback && compareResponse(datablock.response, datablock.target)
		if (showCorrectFeedback) {
			this.renderCorrectFeedback()
		}

		// Answer feedback
		let showFeedback = setParameter(stimulus.feedback, this.feedback, 'boolean')
		if (showFeedback) {
			const feedbackStimulus = this.buildFeedback(stimulus, datablock)
			this._stimuliList.push(feedbackStimulus)
		}

		const correctFeedbackTime = showCorrectFeedback ? setParameter(stimulus.correct_feedback_time, this.correct_feedback_time, 'number') : 0
		setTimeout(() => {
			// No more stimuli left, so end the trial
			if (this._stimuliList.length === 0) {
				this.end()
				return
			}

			this.isiWait(() => {
				this.on_stimulus_start(this.pluginAPI)
				this.showRecall(this._stimuliList.pop())
			})
		}, correctFeedbackTime)
	}

	end() {
		this.$display_element.empty()
		this.done_callback(this._data.getDataBlocks())
		this._data.finishTrial()
	}

	get pluginAPI() {
		return {
			getAllData: () => { return this._data.getDataBlocks() },
			getLastData: () => { return this._data.getDataBlocks().slice(-1)[0] },
			getCompletedStimuli: () => { return this._completedStimuliList.slice() },
			getRemainingStimuli: () => { return this._stimuliList.slice() },
			setTimeline: (newTimeline) => { this._stimuliList = newTimeline.slice() }
		}
	}

	buildTemplate() {
		this.$title = $(`
			<div class="row justify-content-center">
				<h1>${this.title}</h1>
			</div>
		`)
		this.$display_element.append(this.$title)

		this.$display_element.append(`
			<div class="row mt-4 mb-4">
				<div class="col" id="trial_container"></div>
			</div>
		`)
		this.$trial_container = $('#trial_container')

		this.$display_element.append(`
			<div class="row">
				<div class="col text-center" id="button_container"></div>
			</div>
		`)
		this.$button_container = $('#button_container')

		this.$display_element.append(`
				<div class="row mt-2">
					<div class="col text-center" id="progress_container"></div>
				</div>
			`)
		this.$progress_container = $('#progress_container')

		if (!this.show_progress) {
			this.$progress_container.empty()
		}
	}

	buildFeedback(stimulus, dataBlock) {
		let cueList = []
		if (dataBlock.cue) {
			cueList.push('Question: ' + dataBlock.cue)
		}

		if (dataBlock.target) {
			cueList.push('Correct answer: ' + dataBlock.target)
		}

		cueList.push('Your answer: ' + dataBlock.response)

		let feedbackStimulus = {
			cue_list: cueList,
			show_i_dont_know: false,
			feedback: false,
			_feedback: true, // internal feedback stimulus
			response_count: 0
		}

		const feedbackHtml = setParameter(stimulus.feedback_html, this.feedback_html, null)
		if (feedbackHtml) {
			delete feedbackStimulus.cue_list
			feedbackStimulus.text = feedbackHtml(this._data.getDataBlocks())
		}

		return feedbackStimulus
	}

	renderCorrectFeedback() {
		const $feedback = $(`
			<div class="row justify-content-center">
				<h2 class="text-success">Correct</h2>
			</div>
		`)
		this.$trial_container.append($feedback)
	}

	isiWait(callback) {
		$hide(this, $('input, textarea'))
		$hide(this, this.$title)
		$hide(this, this.$button_container)
		$hide(this, this.$trial_container)

		if (!this.progress_total_time) {
			this.$progress_container.hide()
		} else if (this.show_progress && this.show_button) {
			// When experiment is self-paced, advance the progress bar through isi
			this._totalProgressBar.progressByTime(this.isi_time)
		}

		const self = this
		setTimeout(() => {
			$show(self, self.$title)
			$show(self, self.$button_container)
			$show(self, self.$trial_container)
			$show(self, self.$progress_container)
			callback()
		}, this.isi_time)
	}
}

module.exports = Core
},{"./buttons":12,"./constants":13,"./data":15,"./handlers/forcedResponseHandler":17,"./progressBar":22,"./util":24,"./views/recall/horizontalView":26,"./views/recall/standardView":27,"./views/recall/wordBankView":28,"./views/response/buttonView":29,"./views/response/freeRecallView":30,"./views/response/inputView":31,"./views/response/radioView":32,"./views/response/sliderView":34,"uuid4":11}],15:[function(require,module,exports){
const Scorer = require('./scoring')
const uuid4 = require('uuid4')

// Util
const setParameter = require('./util').setParameter

class Data {
    constructor(coreInstance) {
        this.coreInstance = coreInstance
        this.scoringStrategy = this.coreInstance.scoringStrategy
        this.scoringParams = this.coreInstance.scoringParams
        this.scorer = null
        this.dataBlocks = []
        this.response_index = 0
        this.currentDataBlock = {}
        this.startTime = -1

		/**
		 * When resolving a promise, an item is added to the stack.
		 * When resolved, an item is removed. If the stack is empty, there are
		 * no pending promises.
		 */
        this._promiseStack = []

		/**
		 * If the trial is done, mark this as true. It will be checked
		 * when a promise is resolved. If it is true and there is an unresolved
		 * promise, then finishTrial will be called from the promise.
		 */
        this._finishReady = false

        if (this.scoringStrategy) {
            this.scorer = new Scorer(this.scoringStrategy, this.scoringParams)
        }
    }

    startRecall({ cue = '', target = '', cue_list = [], target_list = [], type = "", metadata = {} }) {
        ++this.response_index
        this.startTime = Date.now()
        this.currentDataBlock = new DataBlock()
        this.currentDataBlock.cue = setParameter(cue, '', null)
        this.currentDataBlock.target = setParameter(target, '', null)
        this.currentDataBlock.type = setParameter(type, '', null)
        this.currentDataBlock.response_index = setParameter(this.response_index, '', null)
        this.currentDataBlock._data = setParameter(metadata, {}, null)

        if (cue_list.length) {
            this.currentDataBlock.cue_list = setParameter(cue_list, '', null)
        }

        if (target_list.length) {
            this.currentDataBlock.target_list = setParameter(target_list, '', null)
        }
    }

    endRecall() {
        // Score the data block
        if (this.scorer) {
            let targets = Boolean(this.currentDataBlock.target_list) ? this.currentDataBlock.target_list : this.currentDataBlock.target
            const responseIndex = this.response_index
            const currentDataBlock = this.currentDataBlock

            this._promiseStack.push(1)
            this.scorer
                .score(currentDataBlock.response, targets)
                .then(score => {
                    this._promiseStack.pop()
                    currentDataBlock.score = score
                    let prev_score = 0
                    if (responseIndex > 0) {
                        prev_score = this.dataBlocks[responseIndex - 1].cumulative_score
                    }

                    if (Array.isArray(currentDataBlock.score)) {
                        currentDataBlock.total_score = currentDataBlock.score.reduce((a, b) => a + b, 0)
                        currentDataBlock.cumulative_score = prev_score + currentDataBlock.total_score
                    } else {
                        currentDataBlock.cumulative_score = prev_score + currentDataBlock.score
                    }

                    // Promise has been resolved after the trial is done
                    if (this._finishReady) {
                        this.finishTrial()
                    }
                })
        }

        if (this.currentDataBlock.response.length === 0) {
            this.currentDataBlock.response = ''
        }

        if (this.currentDataBlock.response.length === 1) {
            this.currentDataBlock.response = setParameter(this.currentDataBlock.response[0], null, null)
        }

        if (this.coreInstance.show_button) {
            this.currentDataBlock.rt = Date.now() - this.startTime
        }

        // Record metadata
        const metadata = this.currentDataBlock._data
        delete this.currentDataBlock._data
        Object.assign(this.currentDataBlock, metadata)

        this.dataBlocks.push(this.currentDataBlock)
    }

    registerKeyPress() {
        if (this.currentDataBlock.rt_first_keypress === -1) {
            this.currentDataBlock.rt_first_keypress = Date.now() - this.startTime
        }

        this.currentDataBlock.rt_last_keypress = Date.now() - this.startTime
        this.currentDataBlock.rt = Date.now() - this.startTime
    }

    registerButtonPress() {
        this.currentDataBlock.rt = Date.now() - this.startTime
    }

    recordResponse(response) {
        this.currentDataBlock.response.push(response)
    }

    recordHoneypotResponse(response) {
        this.currentDataBlock.honeypot_response.push(response)
    }

    finishTrial() {
        this._finishReady = true

        if (this._promiseStack.length !== 0) {
            // Finish the trial after the unresolved promise is done
            return
        }

        const _db = this.dataBlocks.slice()
        const lastBlock = _db.pop()

        _db.forEach((dataBlock) => jsPsych.data.write(this._cleanDataBlock(dataBlock)))

        jsPsych.finishTrial(this._cleanDataBlock(lastBlock))
    }

    getDataBlocks() {
        return this.dataBlocks.slice()
    }

    _cleanDataBlock(block) {
        // We don't want jsPsych saving empty strings
        block.clean()
        block.setBlankResponseTimesToNull()

        return block
    }
}

class DataBlock {
    constructor() {
        this._id = uuid4()
        this.cue = ''
        this.cue_list = ''
        this.target = ''
        this.target_list = ''
        this.response = []
        this.response_index = 0
        this.rt = -1
        this.rt_first_keypress = -1
        this.rt_last_keypress = -1
        this.type = ''
        this.cumulative_score = ''
        this.total_score = ''
        this._data = {}
    }

    clean() {
        for (let key in this) {
            const value = this[key]
            if (typeof value === 'string' && value.length === 0) {
                delete this[key]
            }
        }

        delete this._id
    }

    setBlankResponseTimesToNull() {
        for (let key in this) {
            if ((this[key] === -1) && (key === "rt" || key === "rt_first_keypress" || key === "rt_last_keypress")) {
                delete this[key]
            }
        }
    }
}

module.exports = Data
},{"./scoring":23,"./util":24,"uuid4":11}],16:[function(require,module,exports){
const ButtonResponseContainer = require('../views/response/responseContainer').ButtonResponseContainer

class ButtonHandler {
    constructor(nextButton, responseButtons) {
        this.$nextButton = nextButton
        this.responseButtons = responseButtons.filter(rb => rb instanceof ButtonResponseContainer)
    }

    handleInputs() {
        $('#button_container').hide()
        this.responseButtons.forEach(responseButton => {
            const $responseButton = responseButton.get$()
            $responseButton.click(() => {
                responseButton.select()
                this.$nextButton.click()
            })
        })
    }
}

module.exports = ButtonHandler
},{"../views/response/responseContainer":33}],17:[function(require,module,exports){
/**
 * Handler that disables the next button if any of the inputs
 * have less than 3 characters in them
 */

class ForcedResponseHandler {
	constructor() {
		this.$nextButton = null
	}

	register(nextButton, responseView) {
		this.view = responseView
		this.$nextButton = nextButton
		this.$nextButton.prop('disabled', true)
		this.handler = this.view.createHandler(this.$nextButton)
		this.handler.handleInputs()
	}
}

module.exports = ForcedResponseHandler
},{}],18:[function(require,module,exports){
const setInterval = require('../util').setInterval
const setTimeout = require('../util').setTimeout

class FreeRecallHandler {
    constructor(nextButton, responseContainer) {
        this.$nextButton = nextButton
        this.responseContainer = responseContainer
    }

    checkInputs() {
        if (!this.$nextButton) return

        let isValid = true
        isValid = this.responseContainer
            .generator
            .sharedResponsePanelBody
            .find('.text-col').length > 0

        if (isValid) {
            this.$nextButton.prop('disabled', false)
        } else {
            this.$nextButton.prop('disabled', true)
        }
    }

    handleInputs() {
        this.responseContainer.generator.sharedResponsePanelBody.click(() => {
            this.checkInputs()
        })
        this.responseContainer.$input.keydown((event) => {
            if (event.which === 13)
                setTimeout(() => this.checkInputs(), 10)
        })
    }
}

module.exports = FreeRecallHandler
},{"../util":24}],19:[function(require,module,exports){
class InputHandler {
    constructor(nextButton) {
        this.$nextButton = nextButton
    }

    checkInputs() {
        if (!this.$nextButton) return

        let isValid = true
        $('input[type=text]:not(.pcllab-hp-input), textarea:not(.pcllab-hp-input)').each(function () {
            const $input = $(this)
            if ($input.val().length < 3) {
                isValid = false
            }
        })

        if (isValid) {
            this.$nextButton.prop('disabled', false)
        } else {
            this.$nextButton.prop('disabled', true)
        }
    }

    handleInputs() {
        // Reset event listeners
        $('input[type=text], textarea').off('keyup.forcedResponse')

        const self = this
        $('input[type=text], textarea').each(function () {
            const $input = $(this)
            $input.on('keyup.forcedResponse', () => {
                self.checkInputs()
            })
        })
    }
}

module.exports = InputHandler
},{}],20:[function(require,module,exports){
class RadioHandler {
    constructor(nextButton) {
        this.$nextButton = nextButton
    }

    checkInputs() {
        if (!this.$nextButton) return

        let isValid = false
        $('input[type=radio]:not(.pcllab-hp-input), textarea:not(.pcllab-hp-input)').each(function () {
            const $input = $(this)
            if ($input.is(':checked')) {
                isValid = true
            }
        })

        if (isValid) {
            this.$nextButton.prop('disabled', false)
        } else {
            this.$nextButton.prop('disabled', true)
        }
    }

    handleInputs() {
        // Reset event listeners
        $('input[type=radio]').off('click.forcedResponse')

        const self = this
        $('input[type=radio]').each(function () {
            const $input = $(this)
            $input.on('click.forcedResponse', () => {
                self.checkInputs()
            })
        })
    }
}

module.exports = RadioHandler
},{}],21:[function(require,module,exports){
const Core = require('./core')
const evaluateFunctionParameters = require('./util').evaluateFunctionParameters

jsPsych.plugins["pcllab-core"] = (function () {
	let plugin = {}

	plugin.info = {
		name: 'pcllab-core',
		parameters: {}
	}

	plugin.trial = function (display_element, trial) {
		trial = evaluateFunctionParameters(trial)

		$('body').bind('copy paste', function (e) {
			e.preventDefault(); return false;
		})

		const core = new Core(display_element, trial)
		core.start()
	}

	return plugin
})()
},{"./core":14,"./util":24}],22:[function(require,module,exports){
/**
 * @name Progress Bar
 *
 * @param {number}	[duration]	Duration of the progress bar in ms
 * @param {boolean}	[reverse]	If true, renders the progress bar backwards
 * 
 * @author Vishnu Vijayan
 */

const setInterval = require('./util').setInterval
const setTimeout = require('./util').setTimeout

class ProgressBar {
	constructor(duration, reverse) {
		if (isNaN(duration)) {
			throw new Error("Progress bar duration is invalid")
		}

		this.duration = duration
		this.reverse = Boolean(reverse)

		this.$progressBarContainer = $('<div class="progress"></div>')
		this.$progressBar = $('<div class="determinate" id="progressBar"></div>')
		this.$progressBar.css({ 'animation-duration': this.duration + 'ms' })

		if (this.reverse) {
			this.$progressBar.addClass('reverse')
		}

		this.$progressBarContainer.append(this.$progressBar)
	}

	get$Element() {
		return this.$progressBarContainer
	}

	start() {
		this.$progressBarContainer.show()
		this.$progressBar.show()
		this.$progressBar.css({ 'animation-play-state': 'running' })
	}

	stop() {
		this.$progressBar.css({ 'animation-play-state': 'paused' })
	}

	done(callback) {
		if (typeof callback === 'function') {
			this.$progressBar.on('animationend', callback)
		}
	}
}

module.exports.ProgressBar = ProgressBar

class TotalProgressBar {
	constructor(coreInstance) {
		this.coreInstance = coreInstance
		this.duration = this._calculateDuration()
		this.$progressBarContainer = $('<div class="progress"></div>')
		this.$progressBar = $('<div class="determinate" id="progressBar"></div>')
		this.$progressBar.css({ 'animation-duration': this.duration + 'ms' })
		this.$progressBarContainer.append(this.$progressBar)
	}

	get$Element() {
		return this.$progressBarContainer
	}

	start() {
		this.$progressBarContainer.show()
		this.$progressBar.show()
		this.$progressBar.css({ 'animation-play-state': 'running' })
	}

	stop() {
		this.$progressBar.css({ 'animation-play-state': 'paused' })
	}

	progressByTime(duration) {
		this.start()
		setTimeout(() => this.stop(), duration)
	}

	done(callback) {
		if (typeof callback === 'function') {
			this.$progressBar.on('animationend', callback)
		}
	}

	_calculateDuration() {
		let n = this.coreInstance.stimuli.length
		let isi_time = this.coreInstance.isi_time
		let trial_time = this.coreInstance.show_button ? this.coreInstance.minimum_time : this.coreInstance.maximum_time
		return (trial_time + isi_time) * n
	}
}

module.exports.TotalProgressBar = TotalProgressBar
},{"./util":24}],23:[function(require,module,exports){
const SS = require('string-similarity')
const SCORING_STRATEGY = require('./constants').SCORING_STRATEGY

class Scorer {
    constructor(strategy, params) {
        this.model = null
        switch (strategy) {
            case SCORING_STRATEGY.exact: this.model = new ExactModel(); break;
            case SCORING_STRATEGY.dice: this.model = new DiceModel(); break;
            case SCORING_STRATEGY.ultron: this.model = new UltronModel(params); break;
            default: throw new Error("Invalid scoring strategy specified " + strategy)
        }
    }

    score(cue, target) {
        return this.model.score(cue, target)
    }
}

class ScoringModel {
    _parseInput(cues, targets) {
        if (typeof cues !== "string" && !Array.isArray(cues)) {
            throw new Error("Input response is of invalid type " + JSON.stringify(cues))
        }

        if (typeof targets !== "string" && !Array.isArray(targets)) {
            throw new Error("Input target is of invalid type " + JSON.stringify(cues))
        }

        let parsed = {}

        if (typeof cues === "string") {
            parsed.cues = [cues]
        } else if (Array.isArray(cues)) {
            parsed.cues = cues
        }

        if (typeof targets === "string") {
            parsed.targets = [targets]
        } else if (Array.isArray(targets)) {
            parsed.targets = targets
        }

        if (parsed.cues.length !== parsed.targets.length) {
            throw new Error("Number of targets do not match number of responses")
        }

        parsed.cues.map(cue => cue ? cue : "")
        parsed.cues.map(cue => cue.trim())
        parsed.targets.map(target => target ? target : "")
        parsed.targets.map(target => target.trim())

        return parsed
    }

    score(cues, targets) {
        let parsed = this._parseInput(cues, targets)
        let _cues = parsed.cues
        let _targets = parsed.targets

        let res = this.kernel(_cues, _targets)

        return new Promise((resolve, reject) => {
            res.then(scores => {
                if (scores.length == 1) {
                    resolve(scores[0])
                }

                resolve(scores)
            }, err => reject(err))
        })
    }

    kernel(cues, targets) {
        throw new Error("ScoringModel is an abstract class and should not be called directly")
        return [0]
    }
}

class ExactModel extends ScoringModel {
    kernel(cues, targets) {
        return new Promise((resolve, reject) => {
            let scores = cues.map((cue, index) =>
                Number(cue.localeCompare(targets[index], 'en', { sensitivity: 'base' }) === 0))
            resolve(scores)
        })
    }
}

class DiceModel extends ScoringModel {
    kernel(cues, targets) {
        return new Promise((resolve, reject) => {
            let scores = cues.map((cue, index) => SS.compareTwoStrings(cue, targets[index]))
            resolve(scores)
        })
    }
}

class UltronModel extends ScoringModel {
    constructor(ultronParams) {
        super()

        if (ultronParams == null) {
            throw new Error("Automated scoring parameters not specified")
        }
        this.ultronParams = ultronParams
        this.apiUrl = 'https://ultron.psych.purdue.edu:5000/api/score-par'
    }

    kernel(cues, targets) {
        return new Promise((resolve, reject) => {
            let requests = []
            let scores = cues.map(() => -1)
            let errors = []

            cues.forEach((cue, index) => {
                const urlParams = {
                    targets: '["' + targets[index] + '"]',
                    response: cue,
                    models: this.ultronParams.models.join(','),
                    classifier: this.ultronParams.classifier
                }
                const req = $.ajax({
                    type: "get",
                    url: this.apiUrl,
                    data: urlParams,
                    success: (result) => {
                        const error = result.errors
                        if (error) {
                            errors.push(error)
                        } else {
                            scores[index] = score = result.scores[0]
                        }
                    },
                    error: (jqXHR, exception) => {
                        let msg = '';
                        if (jqXHR.status === 0) {
                            msg = 'Not connect.\n Verify Network.'
                        } else if (jqXHR.status == 404) {
                            msg = 'Requested page not found. [404]'
                        } else if (jqXHR.status == 500) {
                            msg = 'Internal Server Error [500].'
                        } else if (exception === 'parsererror') {
                            msg = 'Requested JSON parse failed.'
                        } else if (exception === 'timeout') {
                            msg = 'Time out error.'
                        } else if (exception === 'abort') {
                            msg = 'Ajax request aborted.'
                        } else {
                            msg = 'Uncaught Error.\n' + jqXHR.responseText
                        }
                        console.error(msg)
                    }
                })
                requests.push(req)
            })

            $.when(...requests).done(() => {
                if (errors.length) {
                    console.error(errors)
                }
                resolve(scores)
            })
        })
    }
}

module.exports = Scorer
},{"./constants":13,"string-similarity":9}],24:[function(require,module,exports){
module.exports.setParameter = (value, defaultValue, expectedType) => {
    if (typeof value === "function" && typeof value !== expectedType) {
        value = value()
    }

    if (expectedType && typeof value === expectedType) {
        return value
    }

    if (typeof value !== 'undefined') {
        return value
    }

    return defaultValue
}

module.exports.setParameterFromConstants = (value, constants, defaultValue, expectedType) => {
    if (typeof value === "function" && typeof value !== expectedType) {
        value = value()
    }

    if (typeof value === 'undefined') {
        return defaultValue
    }

    if (typeof value !== expectedType) {
        throw new Error(String(value) + "is not a valid parameter")
    }

    for (let key in constants) {
        constant = String(constants[key])
        if (typeof constant === "number") {
            if (constant === Number(value)) {
                return constant
            }
        } else {
            if (String(constant).localeCompare(String(value), 'en', { sensitivity: 'base' }) === 0) {
                return constant
            }
        }
    }

    throw new Error(String(value) + "is not a valid parameter")
}

module.exports.$hide = (coreInstance, $el) => {
    $el.addClass('notransition')
    if (coreInstance.progress_total_time) {
        $el.css("visibility", "hidden")
    } else {
        $el.hide()
    }
}

module.exports.$show = (coreInstance, $el) => {
    $el[0].offsetHeight
    $el.removeClass('notransition')
    if (coreInstance.progress_total_time) {
        $el.css("visibility", "visible")
    } else {
        $el.show()
    }
}

module.exports.$disableSelect = ($el) => {
    if (!$el) {
        return
    }

    $el.css('-webkit-touch-callout', 'none')
        .css('-webkit-user-select', 'none')
        .css('-khtml-user-select', 'none')
        .css('-moz-user-select', 'none')
        .css('-ms-user-select', 'none')
        .css('user-select', 'none')
}

module.exports.evaluateFunctionParameters = (trial) => {
    // save hooks
    hookNames = ['on_stimulus_start', 'on_stimulus_end', 'done_callback', 'feedback_html']
    hooks = []

    hookNames.forEach(hook => hooks.push(trial[hook]))

    // flatten callbacks
    hookNames.forEach(hook => { delete trial[hook] })
    let _trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial)

    // restore hooks
    hookNames.forEach((hook, index) => { _trial[hook] = hooks[index] })

    return _trial
}

intervals = []
module.exports.setInterval = (callback, time) => {
    const id = setInterval(callback, time)
    intervals.push(id)
}

timeouts = []
module.exports.setTimeout = (callback, time) => {
    const id = setTimeout(callback, time)
    timeouts.push(id)
}

module.exports.clearAllTimers = () => {
    intervals.forEach(id => clearInterval(id))
    timeouts.forEach(id => clearTimeout(id))
}

module.exports.compareResponse = (response, target) => {
    if (typeof response === "string" && typeof target === "string") {
        return response.toLowerCase() === target.toLowerCase()
    }

    return response === target
}
},{}],25:[function(require,module,exports){
(function ($) {
    var rangeWrapper = '.range-field'
    var rangeType = 'input[type=range]:not(.custom-range)'
    var thumbHtml = '<span class="thumb"><span class="value"></span></span>'
    var rangeMousedown = false
    var left

    var addThumb = function addThumb() {
        var $thumb = $(thumbHtml)
        $(rangeType).after($thumb)
    }

    $.fn.rangeSlider = function () {
        const $input = $(this)
        $input.on('change', rangeType, function () {
            var $thumbValue = $thumb.siblings('.thumb').find('.value')
            $thumbValue.html($thumb.val())
        })
        $input.on('input mousedown touchstart', rangeType, function (e) {
            var $this = $(this)
            var $thumb = $this.siblings('.thumb')
            var width = $this.outerWidth()
            var noThumb = !$thumb.length

            if (noThumb) {
                addThumb()
            } // Set indicator value


            $thumb.find('.value').html($this.val())
            rangeMousedown = true
            $this.addClass('active')

            if (!$thumb.hasClass('active')) {
                $thumb.velocity({
                    height: '30px',
                    width: '30px',
                    top: '-20px',
                    marginLeft: '-15px'
                }, {
                        duration: 300,
                        easing: 'easeOutExpo'
                    })
            }

            if (e.type !== 'input') {
                var isMobile = e.pageX === undefined || e.pageX === null

                if (isMobile) {
                    left = e.originalEvent.touches[0].pageX - $(this).offset().left
                } else {
                    left = e.pageX - $(this).offset().left
                }

                if (left < 0) {
                    left = 0
                } else if (left > width) {
                    left = width
                }

                $thumb.addClass('active').css('left', left)
            }

            $thumb.find('.value').html($this.val())
        })
        $input.on('mouseup touchend', rangeWrapper, function () {
            rangeMousedown = false
            $(this).removeClass('active')
        })
        $input.on('mousemove touchmove', rangeWrapper, function (e) {
            var $thumb = $(this).children('.thumb')
            var left

            if (rangeMousedown) {
                if (!$thumb.hasClass('active')) {
                    $thumb.velocity({
                        height: '30px',
                        width: '30px',
                        top: '-20px',
                        marginLeft: '-15px'
                    }, {
                            duration: 300,
                            easing: 'easeOutExpo'
                        })
                }

                var isMobile = e.pageX === undefined || e.pageX === null

                if (isMobile) {
                    left = e.originalEvent.touches[0].pageX - $(this).offset().left
                } else {
                    left = e.pageX - $(this).offset().left
                }

                var width = $(this).outerWidth()

                if (left < 0) {
                    left = 0
                } else if (left > width) {
                    left = width
                }

                $thumb.addClass('active').css('left', left)
                $thumb.find('.value').html($thumb.siblings(rangeType).val())
            }
        })
        $input.on('mouseout touchleave', rangeWrapper, function () {
            if (!rangeMousedown) {
                var $thumb = $(this).children('.thumb')

                if ($thumb.hasClass('active')) {
                    $thumb.velocity({
                        height: '0',
                        width: '0',
                        top: '10px',
                        marginLeft: '-6px'
                    }, {
                            duration: 100
                        })
                }

                $thumb.removeClass('active')
            }
        })

    }

})(jQuery)
},{}],26:[function(require,module,exports){
const RecallStandardView = require('./standardView')

class RecallHorizontalView extends RecallStandardView {
	renderCueList($element) {
		const $row = $('<div>', { class: 'row justify-content-center' })
		$row.appendTo($element)

		this.cue_list.forEach((cue) => {
			$row.append(`
				<div class="col-3 text-center">
					<h3 class="text-center">${cue}</h3>
				</div>
			`)
		})
	}
}

module.exports = RecallHorizontalView
},{"./standardView":27}],27:[function(require,module,exports){
const RESPONSE_TYPE = require('../../constants').RESPONSE_TYPE

/* Util */
const setParameter = require('../../util').setParameter
const $disableSelect = require('../../util').$disableSelect

class RecallStandardView {
	constructor(stimulus) {
		this.response_type = setParameter(stimulus.response_type, RESPONSE_TYPE.input, 'string')

		this.text = setParameter(stimulus.text, '', 'string')
		this.text_panel_title = setParameter(stimulus.text_panel_title, null, 'string')
		this.show_text = setParameter(stimulus.show_text, true, 'boolean')

		this.image = setParameter(stimulus.image, '', 'string')
		this.image_panel_title = setParameter(stimulus.image_panel_title, null, 'string')
		this.show_image = setParameter(stimulus.show_image, true, 'boolean')

		this.cue = setParameter(stimulus.cue, '', 'string')
		this.cue_panel_title = setParameter(stimulus.cue_panel_title, null, 'string')
		this.show_cue = setParameter(stimulus.show_cue, true, 'boolean')

		this.target = setParameter(stimulus.target, '', 'string')
		this.target_panel_title = setParameter(stimulus.target_panel_title, null, 'string')
		this.show_target = setParameter(stimulus.show_target, false, 'boolean')

		this.cue_list = setParameter(stimulus.cue_list, [], null)
		this.cue_list_panel_title = setParameter(stimulus.cue_list_panel_title, null, 'string')
		this.show_cue_list = setParameter(stimulus.show_cue_list, true, 'boolean')

		this.audio_file = setParameter(stimulus.audio_file, null, null)
		this.show_audio = setParameter(stimulus.show_audio, true, 'boolean')
	}

	appendTo($element) {
		if (this.text && this.show_text) {
			this.renderText($element)
		}

		if (this.image && this.show_image) {
			this.renderImage($element)
		}

		if (this.cue && this.show_cue) {
			this.renderCue($element)
		}

		if (this.cue_list && this.show_cue_list) {
			this.renderCueList($element)
		}

		if (this.audio_file && this.show_audio) {
			this.renderAudio($element)
		}
	}

	renderText($element) {
		if (this.text_panel_title) {
			this.renderTextPanel($element)
			return
		}

		const $text = this._make$(`
			<div class="row mb-2">
				<div class="col">
					${this.text}
				</div>
			</div>
		`)
		$element.append($text)
	}

	renderTextPanel($element) {
		let $panel = this._make$(`
			<div class="row card z-depth-1-indigo mb-3">
				<div class="card-header indigo">
					<h5 class="white-text text-uppercase" style="font-weight: 500">${this.text_panel_title}</h5>
				</div>
			</div>
		`)

		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)
		$panelBody.append(this._make$(`
			<div class="row">
				<div class="col text-left">
					${this.text}
				</div>
			</div>
		`))
		$element.append($panel)
	}

	renderImage($element) {
		if (this.image_panel_title) {
			this.renderImagePanel($element)
			return
		}

		$element.append(this._make$(`
			<div class="row text-center mb-2">
				<div class="col text-center">
					<img src="${this.image}" style="max-width:100%">
				</div>
			</div>
		`))
	}

	renderImagePanel($element) {
		let $panel = $(this._make$(`
		<div class="row card z-depth-1-indigo mb-3">
			<div class="card-header indigo">
				<h5 class="white-text text-uppercase" style="font-weight: 500">${this.image_panel_title}</h5>
			</div>
		</div>
		`))
		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)
		$panelBody.append(this._make$(`
			<div class="row text-center mb-2">
				<div class="col text-center">
					<img src="${this.image}" style="max-width:100%">
				</div>
			</div>
		`))
		$element.append($panel)
	}

	renderCue($element) {
		if (this.cue_panel_title) {
			this.renderCuePanel($element)
			return
		}

		let cueStyle = ''
		let targetStyle = ''

		if (this.response_type === RESPONSE_TYPE.study_items) {
			// cueStyle += 'font-size: 35px;'
			cueStyle += 'font-weight: 500;'

			targetStyle += 'margin-top: 2em;'
		}

		const $cue = this._make$(`
			<div class="row">
				<div class="col text-center">
					<h3 class="text-center" style="${cueStyle}">${this.cue}</h3>
				</div>
			</div>
		`)
		$element.append($cue)

		if (this.response_type === RESPONSE_TYPE.study_items) {
			$element.append(this._make$(`
				<div class="row">
					<div class="col text-center">
						<h3 class="text-center" style="${targetStyle}">${this.target}</h3>
					</div>
				</div>
			`))
		}
	}

	renderCuePanel($element) {
		let $panel = this._make$(`
			<div class="row card z-depth-1-indigo mb-3">
				<div class="card-header indigo">
					<h5 class="white-text text-uppercase" style="font-weight: 500">${this.cue_panel_title}</h5>
				</div>
			</div>
		`)
		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)


		let cueStyle = ''
		let targetStyle = ''

		if (this.response_type === RESPONSE_TYPE.study_items) {
			cueStyle += 'font-weight: 500;'
		}

		$panelBody.append(this._make$(`
			<div class="row">
				<div class="col text-left">
					<p tyle="${cueStyle}">${this.cue}</p>
				</div>
			</div>
		`))
		$element.append($panel)

		if (this.response_type === RESPONSE_TYPE.study_items) {
			$panel = this._make$(`
				<div class="row card z-depth-1-indigo mb-3">
					<div class="card-header indigo">
						<h5 class="white-text text-uppercase" style="font-weight: 500">${this.target_panel_title}</h5>
					</div>
				</div>
			`)
			let $panelBody = $(`
				<div class="card-body p-3"></div>
			`)
			$panelBody.appendTo($panel)

			$panelBody.append(this._make$(`
				<div class="row">
					<div class="col text-left">
						<p style="${targetStyle}">${this.target}</p>
					</div>
				</div>
			`))
			$element.append($panel)
		}
	}

	renderCueList($element) {
		if (this.cue_list_panel_title) {
			this.renderCueListPanel($element)
			return
		}

		this.cue_list.forEach((cue) => {
			$element.append(this._make$(`
				<div class="row">
					<div class="col text-center">
						<h3 class="text-center">${cue}</h3>
					</div>
				</div>
			`))
		})
	}

	renderCueListPanel($element) {
		let $panel = $(this._make$(`
			<div class="row card z-depth-1-indigo mb-3">
				<div class="card-header indigo">
					<h5 class="white-text text-uppercase" style="font-weight: 500">${this.cue_list_panel_title}</h5>
				</div>
			</div>
		`))
		let $panelBody = $(`
			<div class="card-body p-3"></div>
		`)
		$panelBody.appendTo($panel)
		this.cue_list.forEach((cue, index) => {
			// Render n-1 dividers
			let hr = index == this.cue_list.length - 1 ? '' : '<hr>'

			$panelBody.append(this._make$(`
				<div class="row">
					<div class="col text-center">
						<h3 class="text-center">${cue}</h3>
						${hr}
					</div>
				</div>
			`))
		})
		$element.append($panel)
	}

	renderAudio($element) {
		// const $iFrame = $(`<iframe src="${this.audio_file}" allow="autoplay" style="display:none" id="audio_element"></iframe>`)
		const $iFrame = $(`<iframe allow="autoplay" style="display:none" ></iframe>`)
		const $iFrameAudio = $(`
			<audio autoplay id="audio_element">
				<source src="${this.audio_file}" type="audio/mpeg">
			</audio>
		`)
		$iFrame.html($iFrameAudio)
		$element.append($iFrame)

		const $audio = $("<audio></audio>").attr({
			'src': this.audio_file,
			'autoplay': 'autoplay',
			'id': 'audio_element'
		})
		$element.append($audio)

		const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
		if (!isChrome) {
			$iFrame.remove()
		} else {
			$audio.remove()
		}
	}

	_make$(content) {
		const $el = $(content)
		$disableSelect($el)
		return $el
	}
}

module.exports = RecallStandardView

},{"../../constants":13,"../../util":24}],28:[function(require,module,exports){
const HoneypotResponseContainer = require('../response/responseContainer').HoneypotResponseContainer
const setParameter = require('../../util').setParameter
const CUE_ALIGNMENT = require('../../constants').CUE_ALIGNMENT
const dragula = require('dragula')

class RecallWordBankView {
    constructor(stimulus, alignment) {
        this.word_list = setParameter(stimulus.word_list, [], null)
        this.alignment = setParameter(alignment, CUE_ALIGNMENT.vertical, 'string')
        this._drake = null
    }

    appendTo($element) {
        this.renderWordBank($element)
    }

    renderWordBank($element) {
        this._drake = dragula({
            accepts: (el, target, source, sibling) => {
                if (target == source) {
                    return false
                }
            }
        })
        this._drake.on('accepts', (el) => {
            console.log(el)
        })

        let rowHeight = ''
        if (this.alignment === CUE_ALIGNMENT.vertical) {
            rowHeight = 'h-100'
        }

        let $row = $('<div>', {
            class: `row ${rowHeight} mb-3 p-3 ml-1 mr-1`,
            style: 'border: 1px solid #EBEBEB; border-radius: 0.3em'
        })

        let colWidth = 'col-3'
        if (this.alignment === CUE_ALIGNMENT.vertical) {
            colWidth = 'col-12'
        }

        for (let i = 0; i < this.word_list.length; i++) {
            let $col = $(`
                <div class="${colWidth} mb-2 text-center">
                    <span style="cursor: pointer">
                        ${this.word_list[i]}
                    </span>
                </div>
            `)
            $row.append($col)
        }
        this._drake.containers.push($row[0])
        $element.append($row)
    }

    dragEnd(callback) {
        this._drake.on('dragend', (el, container, source) => {
            callback(el)
        })
    }

    attachInputs(responseContainers) {
        for (let responseContainer of responseContainers) {
            if (responseContainer instanceof HoneypotResponseContainer) {
                continue
            }
            this.dragEnd(responseContainer.onDragEnd())
        }
    }
}

module.exports = RecallWordBankView
},{"../../constants":13,"../../util":24,"../response/responseContainer":33,"dragula":8}],29:[function(require,module,exports){
const InputView = require('./inputView')
const ButtonResponseContainer = require('./responseContainer').ButtonResponseContainer
const ButtonHandler = require('../../handlers/buttonHandler')

// Util
const setParameter = require('../../util').setParameter

class ButtonView extends InputView {
    newResponseContainer(buttonLabel) {
        const rc = new ButtonResponseContainer(this,
            buttonLabel,
            this.stimulus,
            this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    render() {
        const buttonLabels = setParameter(this.stimulus.buttons, [], null)

        const showRepeat = setParameter(this.stimulus.show_repeat, this.coreInstance.show_repeat, 'boolean')
        let indexOffset = Number(showRepeat)

        let $currentRow = $()
        let $firstRow = $()
        let index = 0

        buttonLabels.forEach((buttonLabel) => {
            if (index % 4 === 0) {
                $currentRow = $('<div>', {
                    class: 'row justify-content-center mt-4'
                })
                this.$displayElement.append($currentRow)

                if (index < 4) {
                    $firstRow = $currentRow
                }
            }

            index += indexOffset
            indexOffset = 0

            const responseContainer = this.newResponseContainer(buttonLabel)

            const col = $('<div>', {
                class: 'col-3 text-center'
            })

            $currentRow.append(col)
            col.append(responseContainer.get$())
        })

        // Move repeat button
        if (showRepeat) {
            const col = $('<div>', {
                class: 'col-3 text-center'
            })
            $firstRow.prepend(col)
            setTimeout(() => col.append(this.coreInstance.$repeatButton), 5)
        }

        // Auto focus first input
        this.focusContainer(0)

        // Render honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }

    createHandler(nextButton) {
        return new ButtonHandler(nextButton, this.responseContainers)
    }
}

module.exports = ButtonView
},{"../../handlers/buttonHandler":16,"../../util":24,"./inputView":31,"./responseContainer":33}],30:[function(require,module,exports){
const InputView = require('./inputView')
const FreeRecallResponseContainer = require('./responseContainer').FreeRecallResponseContainer
const FreeRecallHandler = require('../../handlers/freeRecallHandler')

// Util
const setParameter = require('../../util').setParameter

class FreeRecallView extends InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        super($displayElement, coreInstance, dataInstance, stimulus)
        this.responseContainer = null
    }

    newResponseContainer() {
        const rc = new FreeRecallResponseContainer(this,
            this.stimulus,
            this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    render() {
        const $row = $('<div>', { class: 'row mx-auto', style: 'width: 70%' })
        $row.appendTo(this.$displayElement)
        const $col = $('<div>', { class: 'col' })
        $col.appendTo($row)

        this.responseContainer = this.newResponseContainer()
        $col.append(this.responseContainer.get$())

        this.focusContainer(0)

        // Render Honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }

    createHandler(nextButton) {
        return new FreeRecallHandler(nextButton, this.responseContainer)
    }
}

module.exports = FreeRecallView
},{"../../handlers/freeRecallHandler":18,"../../util":24,"./inputView":31,"./responseContainer":33}],31:[function(require,module,exports){
const InputResponseContainer = require('./responseContainer').InputResponseContainer
const HoneypotResponseContainer = require('./responseContainer').HoneypotResponseContainer

// Util
const setParameter = require('../../util').setParameter

// Handler
const InputHandler = require('../../handlers/inputHandler')

class InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        this.$displayElement = $displayElement
        this.coreInstance = coreInstance
        this.dataInstance = dataInstance
        this.stimulus = stimulus
        this.responseContainers = []

        // Generator properties
        this.sharedResponsePanelBody = $()
        this.sharedResponsePanel = $()
        this.numResponseContainers = 0
    }

    newResponseContainer() {
        const rc = new InputResponseContainer(this,
            this.coreInstance.input_size,
            this.coreInstance.response_box_align,
            this.stimulus,
            this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    newHoneypotResponseContainer() {
        const rc = new HoneypotResponseContainer(this,
            this.coreInstance.input_size,
            this.coreInstance.response_box_align,
            this.stimulus,
            this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    render() {
        // Use stimulus response count over global response count, if mentioned
        const responseCount = setParameter(this.stimulus.response_count, this.coreInstance.response_count, 'number')

        for (let i = 0; i < responseCount; i++) {
            const responseContainer = this.newResponseContainer()

            const row = $('<div>', {
                class: 'row'
            })

            const col = $('<div>', {
                class: 'col text-center'
            })

            this.$displayElement.append(row)
            row.append(col)
            col.append(responseContainer.get$())
        }

        // Auto focus first input
        this.focusContainer(0)

        // Render honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }

    focusContainer(containerIndex) {
        if (this.responseContainers.length) {
            this.responseContainers[containerIndex].focus()
        }
    }

    createHandler(nextButton) {
        return new InputHandler(nextButton)
    }
}

module.exports = InputView
},{"../../handlers/inputHandler":19,"../../util":24,"./responseContainer":33}],32:[function(require,module,exports){
const InputView = require('./inputView')
const RadioResponseContainer = require('./responseContainer').RadioResponseContainer

// Util
const setParameter = require('../../util').setParameter

// Handler
const RadioHandler = require('../../handlers/radioHandler')

class RadioView extends InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        super($displayElement, coreInstance, dataInstance, stimulus)
    }

    newResponseContainer() {
        const rc = new RadioResponseContainer(this, this.stimulus, this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers
        return rc
    }

    render() {
        const responseContainer = this.newResponseContainer()

        const row = $('<div>', {
            class: 'row'
        })

        const col = $('<div>', {
            class: 'col text-center'
        })

        this.$displayElement.append(row)
        row.append(col)

        col.append(responseContainer.get$())

        // Auto focus first input
        this.focusContainer(0)

        // Render honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }

    createHandler(nextButton) {
        return new RadioHandler(nextButton)
    }
}

module.exports = RadioView
},{"../../handlers/radioHandler":20,"../../util":24,"./inputView":31,"./responseContainer":33}],33:[function(require,module,exports){
require('../misc/slider')
const Data = require('../../data')

// Util
const UUID4 = require('uuid4')
const setParameter = require('../../util').setParameter
const setInterval = require('../../util').setInterval
const setTimeout = require('../../util').setTimeout

// Constants
const RESPONSE_ALIGNMENT = require('../../constants').RESPONSE_ALIGNMENT
const INPUT_SIZE = require('../../constants').INPUT_SIZE
const getButtonColorClass = require('../../constants').getButtonColorClass

/* Response container interface */
class ResponseContainer {
	constructor() {
		this._id = UUID4()
	}

	get$() { }
	focus() { }
	saveResponse() { }
	remove() { }
}

class InputResponseContainer extends ResponseContainer {
	constructor(generatorInstance, containerSize, textAlignment, stimulus, dataInstance) {
		super()

		this.generator = generatorInstance
		this.data = dataInstance
		this.stimulus = stimulus
		this.mouseOver = false

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this.form = $('<div>', {
			class: 'md-form core-input-form md-outline w-75',
			style: 'display: block; margin-left: auto; margin-right: auto;'
		})

		this.panel = $()

		let alignment = 'text-center'
		switch (textAlignment) {
			case RESPONSE_ALIGNMENT.center: alignment = 'text-center'; break;
			case RESPONSE_ALIGNMENT.left: alignment = 'text-left'; break;
			case RESPONSE_ALIGNMENT.right: alignment = 'text-right'; break;
		}

		switch (containerSize) {
			case INPUT_SIZE.small: {
				this.textarea = $('<input>', {
					class: `core-input-sm form-control pb-2 ${alignment}`,
					type: 'text',
					id: this._id
				})
				break
			}
			case INPUT_SIZE.medium: {
				this.textarea = $('<textarea>', {
					class: `md-textarea core-input-md form-control pb-2 ${alignment}`,
					id: this._id
				})
				break
			}
			case INPUT_SIZE.large: {
				this.textarea = $('<textarea>', {
					class: `md-textarea core-input-lg form-control pb-2 ${alignment}`,
					style: 'height: 130px',
					id: this._id
				})
				break
			}
			case INPUT_SIZE.xlarge: {
				this.textarea = $('<textarea>', {
					class: `md-textarea core-input-xl form-control pb-2 ${alignment}`,
					style: 'min-height: 500px; height: 55vh',
					id: this._id
				})
				// Make it extra thicc
				this.form.removeClass('w-75')
				this.form.addClass('w-100')
				break
			}
			default: {
				this.textarea = $('<textarea>', {
					class: `pcllab-cued-recall-xlarge-input core-input form-control pb-2 ${alignment}`,
					style: 'height: 200px',
					id: this._id
				})
			}
		}
		this.label = $('<label>', { text: 'Type your response', for: this._id })

		if (this.stimulus.response_panel_title) {
			this._makePanel()
		}

		this.textarea.keypress(this.onKeyPress())
		this.textarea.mouseenter(this.onMouseEnter())
		this.textarea.mouseleave(this.onMouseLeave())
		this.textarea.bind('copy paste cut', (e) => e.preventDefault())

		this.form.append(this.textarea)
		// this.form.append(this.label)
	}

	get$() {
		if (this.stimulus.response_panel_title) {
			if (this.generator.numResponseContainers == 1) {
				return this.generator.sharedResponsePanel
			} else {
				return $()
			}
		}
		else {
			return this.form
		}
	}

	remove() {
		if (this.stimulus.response_panel_title && this.generator.numResponseContainers == 1) {
			this.generator.sharedResponsePanel.remove()
		}
		else {
			this.form.remove()
		}
	}

	focus() {
		setTimeout(() => {
			this.form.find('textarea, input').focus();
		}, 0)
	}

	saveResponse() {
		this.data.recordResponse(this.textarea.val())
	}

	onKeyPress() {
		const self = this
		return ($event) => {
			self.data.registerKeyPress()
		}
	}

	onMouseEnter() {
		const self = this
		return () => {
			self.mouseOver = true
		}
	}

	onMouseLeave() {
		const self = this
		return () => {
			self.mouseOver = false
		}
	}

	onDragEnd() {
		const self = this
		return (el) => {
			setTimeout(() => {
				if (self.mouseOver) {
					self.textarea.val($(el).text().trim())
					self.data.registerKeyPress()
				}
			}, 50)
		}
	}

	_makePanel() {
		this.form = $('<div>', {
			class: 'md-form md-outline w-100',
			style: 'display: block; margin-left: auto; margin-right: auto;'
		})

		if (this.generator.numResponseContainers == 0) {
			this.generator.sharedResponsePanel = $(`
				<div class="row card rounded z-depth-1-indigo mb-3">
					<div class="card-header indigo">
						<h5 class="white-text text-uppercase text-left" style="font-weight: 500">${this.stimulus.response_panel_title}</h5>
					</div>
				</div>
			`)

			this.generator.sharedResponsePanelBody = $(`
				<div class="card-body p-3"></div>
			`)
			this.generator.sharedResponsePanelBody.appendTo(this.generator.sharedResponsePanel)
		}
		this.generator.sharedResponsePanelBody.append(this.form)
	}
}

module.exports.InputResponseContainer = InputResponseContainer

class SliderResponseContainer extends ResponseContainer {
	constructor(generatorInstance, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)

		this.min = setParameter(this.stimulus.slider_min, 0, 'number')
		this.max = setParameter(this.stimulus.slider_max, 100, 'number')
		this.labelLeft = setParameter(this.stimulus.slider_label_left, '', 'string')
		this.labelRight = setParameter(this.stimulus.slider_label_right, '', 'string')

		this.$sliderContainer = $(`
			<div class="d-flex justify-content-center my-4">
				<span class="mr-2 mt-1">${this.labelLeft}</span>
					<form class="range-field w-75">
						<input class="border-0" type="range" min="${this.min}" max="${this.max}" />
					</form>
				<span class="ml-2 mt-1">${this.labelRight}</span>
			</div>
		`)
		this.$slider = this.$sliderContainer.find('input')
		this.$slider.rangeSlider()

		if (!this.data) {
			throw new Error("No data instance specified")
		}
	}

	get$() {
		return this.$sliderContainer
	}

	remove() {
		this.$sliderContainer.remove()
	}
	focus() { }
	saveResponse() { }
}

module.exports.SliderResponseContainer = SliderResponseContainer

class RadioResponseContainer extends ResponseContainer {
	constructor(generatorInstance, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)
		this.responseList = setParameter(stimulus.response_list, [], null)

		this._formWidth = -1
		this._selected = null

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this._makePanel()

		if (this.stimulus.radio_title) {
			this.generator.sharedResponsePanelBody.append(`
				<h5 class="text-center mt-2">${this.stimulus.radio_title}</h5>
			`)
		}

		this.form = $('<div>', { style: 'margin: 0 auto; text-align: left' })
		this.form.css("visibility", "hidden")
		this.form.appendTo(this.generator.sharedResponsePanelBody)
		this.responseList.forEach(label => {
			const _id = UUID4()
			const $radio = $(`
				<div class="md-radio">
					<input type="radio" id="${_id}" name="materialExampleRadios" value="${label}">
					<label style="display: inline-block; margin: 0 1%; font-size: 1rem; text-align: left; padding: 0 15px 0 28px" for="${_id}">${label}</label>
				</div>
			`)
			this.form.append($radio)

			// Listen for value changes
			$radio.find('input').change((event) => {
				this.data.registerKeyPress()
				this._selected = event.currentTarget.value
			})
		})

		// Update the size of the container based on max label width
		setTimeout(() => {
			this.form.find('.md-radio').each((_, radio) => {
				const $radio = $(radio)
				this._formWidth = Math.max($radio.find('label').outerWidth(), this._formWidth)
			})
			this.form.css({
				'width': this._formWidth * 1.1 + 'px',
				'visibility': 'visible'
			})
		}, 10)


	}

	get$() {
		if (this.generator.numResponseContainers == 1) {
			return this.generator.sharedResponsePanel
		} else {
			return $()
		}
	}

	remove() {
		if (this.generator.numResponseContainers == 1) {
			this.generator.sharedResponsePanel.remove()
		}
	}

	focus() { }

	saveResponse() {
		this.data.recordResponse(this._selected)
	}

	_makePanel() {
		if (this.generator.numResponseContainers === 0) {
			if (this.stimulus.response_panel_title) {
				this.generator.sharedResponsePanel = $(`
					<div class="row card rounded z-depth-1-indigo mb-3">
						<div class="card-header indigo">
							<h5 class="white-text text-uppercase text-left" style="font-weight: 500">${this.stimulus.response_panel_title}</h5>
						</div>
					</div>
				`)

				this.generator.sharedResponsePanelBody = $(`
					<div class="card-body p-3"></div>
				`)
				this.generator.sharedResponsePanelBody.appendTo(this.generator.sharedResponsePanel)
			} else {
				this.generator.sharedResponsePanel = $('<div>', { class: 'row' })
				this.generator.sharedResponsePanelBody = $('<div>', { class: 'col' })
				this.generator.sharedResponsePanel.append(this.generator.sharedResponsePanelBody)
			}
		}
	}
}

module.exports.RadioResponseContainer = RadioResponseContainer

class ButtonResponseContainer extends ResponseContainer {
	constructor(generatorInstance, buttonLabel, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)
		this.buttonLabel = buttonLabel

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this._selected = false

		this.$button = $('<button>', {
			class: `btn btn-large ${getButtonColorClass()}`,
			text: this.buttonLabel
		})
	}

	get$() {
		return this.$button
	}

	remove() {
		this.$button.remove()
	}

	focus() {
		setTimeout(() => {
			this.$button.focus();
		}, 0)
	}

	select() {
		this._selected = true
		this.data.registerKeyPress()
	}

	saveResponse() {
		if (this._selected) {
			this.data.recordResponse(this.buttonLabel)
		}
	}
}

module.exports.ButtonResponseContainer = ButtonResponseContainer

class FreeRecallResponseContainer extends ResponseContainer {
	constructor(generatorInstance, stimulus, dataInstance) {
		super()

		this.generator = setParameter(generatorInstance, null, null)
		this.data = setParameter(dataInstance, null, null)
		this.stimulus = setParameter(stimulus, null, null)
		this.textAlignment = setParameter(this.generator.text_align | this.stimulus.text_align,
			RESPONSE_ALIGNMENT.center, 'string')

		let alignment = 'text-center'
		switch (this.textAlignment) {
			case RESPONSE_ALIGNMENT.center: alignment = 'text-center'; break;
			case RESPONSE_ALIGNMENT.left: alignment = 'text-left'; break;
			case RESPONSE_ALIGNMENT.right: alignment = 'text-right'; break;
		}

		this.$listBody = $()
		this.$inputBody = $()

		this.responseList = []

		this.$label = $('<label>', { text: 'Type your response', for: this._id })
		this.$input = $('<input>', {
			class: `form-control pb-2 ${alignment}`,
			type: 'text',
			id: this._id
		})
		this.$input.keypress(this._keyPress())

		if (!this.data) {
			throw new Error("No data instance specified")
		}

		this._makePanel()
	}

	get$() {
		if (this.generator.numResponseContainers == 1) {
			return this.generator.sharedResponsePanel
		} else {
			return $()
		}
	}

	remove() {
		if (this.generator.numResponseContainers == 1) {
			this.generator.sharedResponsePanel.remove()
		}
	}

	focus() {
		setTimeout(() => {
			this.$input.focus()
		}, 0)
	}

	select() {
		this.data.registerKeyPress()
	}

	saveResponse() {
		const self = this
		this.generator
			.sharedResponsePanelBody
			.find('.text-col')
			.each(function () {
				self.data.recordResponse($(this).text())
			})
	}

	_makePanel() {
		if (this.generator.numResponseContainers === 0) {
			this.generator.sharedResponsePanel = $('<div>', {
				class: 'row'
			})
			this.generator.sharedResponsePanelBody = $('<div>', {
				class: 'col md-form md-outline'
			})

			this.generator.sharedResponsePanelBody.appendTo(this.generator.sharedResponsePanel)

			// Response list
			const $listRow = $('<div>', {
				class: 'row'
			})
			this.generator.sharedResponsePanelBody.append($listRow)

			this.$listBody = $('<div>', {
				class: 'col rounded p-3',
				style: 'border: 1px solid #BDBDBD; min-height: 270px'
			})
			$listRow.append(this.$listBody)

			// this.generator.sharedResponsePanelBody.append($('<hr>'))

			const $inputRow = $('<div>', {
				class: 'row mt-4'
			})
			const $inputCol = $('<div>', {
				class: 'col p-0'
			})
			$inputRow.append($inputCol)
			$inputCol.append(this.$input)
			// $inputCol.append(this.$label)
			this.generator.sharedResponsePanelBody.append($inputRow)
		}
	}

	_keyPress() {
		const self = this
		return function (event) {
			const $input = $(this)
			const keycode = event.which

			if (keycode === 13) {
				const text = $input.val().trim()
				$input.val('')
				if (text) {
					self._addListItem(text)
				}
			}

			self.select()
		}
	}

	_addListItem(text) {
		const $row = $('<div>', {
			class: 'row pt-1 pb-1'
		})

		const $fillerCol = $('<div>', {
			class: 'col text-center'
		})
		$fillerCol.appendTo($row)

		const $textCol = $('<div>', {
			class: 'col-10 text-center text-col',
			text: text
		})
		$textCol.appendTo($row)

		const $deleteCol = $('<div>', {
			class: 'col text-center d-flex'
		})
		$deleteCol.appendTo($row)
		const $deleteButton = $(`
			<button class="btn btn-white p-1 pl-2 pr-2 m-0 my-auto" style="border-radius: 99em; box-shadow: none;">
				<span style="color: #f44336; font-weight: bold">✕</span>
			</button>
		`)
		$deleteButton.appendTo($deleteCol)

		$deleteButton.click(() => {
			$row.remove()
			self.select()
		})

		this.$listBody.append($row)
	}
}

module.exports.FreeRecallResponseContainer = FreeRecallResponseContainer

class HoneypotResponseContainer extends InputResponseContainer {
	constructor(generatorInstance, containerSize, textAlignment, stimulus, dataInstance) {
		super(generatorInstance, containerSize, textAlignment, stimulus, dataInstance)
		this.form.css('display', 'none')
		this.label.remove()
	}
	get$() {
		const name_attrs = [
			'age_input', 'name_input', 'breakfast_input',
			'gender_input', 'language_input', 'email_input'
		]
		this.textarea.attr('name', name_attrs[Math.floor(Math.random() * name_attrs.length)])
		this.textarea.attr('tabindex', 1)
		this.textarea.attr('autocomplete', 'off')
		this.textarea.addClass('pcllab-hp-input')
		return this.form
	}

	saveResponse() {
		if (this.textarea.val()) {
			this.data.recordHoneypotResponse(this.textarea.val())
		}
	}

	onKeyPress() {
		return () => { }
	}
}

module.exports.HoneypotResponseContainer = HoneypotResponseContainer

},{"../../constants":13,"../../data":15,"../../util":24,"../misc/slider":25,"uuid4":11}],34:[function(require,module,exports){
const InputView = require('./inputView')
const SliderResponseContainer = require('./responseContainer').SliderResponseContainer

// Util
const setParameter = require('../../util').setParameter

class SliderView extends InputView {
    constructor($displayElement, coreInstance, dataInstance, stimulus) {
        super($displayElement, coreInstance, dataInstance, stimulus)
    }

    newResponseContainer() {
        const rc = new SliderResponseContainer(this, this.stimulus, this.dataInstance)
        this.responseContainers.push(rc)
        ++this.numResponseContainers

        return rc
    }

    render() {
        // Use stimulus response count over global response count, if mentioned
        const responseCount = setParameter(this.stimulus.response_count, this.coreInstance.response_count, 'number')

        for (let i = 0; i < responseCount; i++) {
            const responseContainer = this.newResponseContainer()

            const row = $('<div>', {
                class: 'row'
            })

            const col = $('<div>', {
                class: 'col text-center'
            })

            this.$displayElement.append(row)
            row.append(col)

            const $sliderContainer = responseContainer.get$()
            col.append($sliderContainer)
        }

        // Auto focus first input
        this.focusContainer(0)

        // Render honeypot input
        const hpResponseContainer = this.newHoneypotResponseContainer()
        this.$displayElement.append(hpResponseContainer.get$())
    }
}

module.exports = SliderView
},{"../../util":24,"./inputView":31,"./responseContainer":33}],35:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],36:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":35,"timers":36}]},{},[21])
//# sourceMappingURL=plugin.js.map
