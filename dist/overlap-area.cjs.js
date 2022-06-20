/*
Copyright (c) 2020 Daybrush
name: overlap-area
license: MIT
author: Daybrush
repository: git+https://github.com/daybrush/overlap-area.git
version: 1.1.0
*/
'use strict';

var utils = require('@daybrush/utils');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;

  for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];

  return r;
}

function tinyThrottle(num) {
  return utils.throttle(num, utils.TINY_NUM);
}
function isSameConstants(linearConstants1, linearConstants2) {
  return linearConstants1.every(function (v, i) {
    return tinyThrottle(v - linearConstants2[i]) === 0;
  });
}
function isSamePoint(point1, point2) {
  return !tinyThrottle(point1[0] - point2[0]) && !tinyThrottle(point1[1] - point2[1]);
}
function flat(arr) {
  return arr.reduce(function (prev, current) {
    prev.push.apply(prev, current);
    return prev;
  }, []);
}

/**
 * @namespace OverlapArea
 */

/**
 * Gets the size of a shape (polygon) made of points.
 * @memberof OverlapArea
 */

function getAreaSize(points) {
  if (points.length < 3) {
    return 0;
  }

  return Math.abs(utils.sum(points.map(function (point, i) {
    var nextPoint = points[i + 1] || points[0];
    return point[0] * nextPoint[1] - nextPoint[0] * point[1];
  }))) / 2;
}
/**
 * Get points that fit the rect,
 * @memberof OverlapArea
 */

function fitPoints(points, rect) {
  var width = rect.width,
      height = rect.height,
      left = rect.left,
      top = rect.top;

  var _a = getMinMaxs(points),
      minX = _a.minX,
      minY = _a.minY,
      maxX = _a.maxX,
      maxY = _a.maxY;

  var ratioX = width / (maxX - minX);
  var ratioY = height / (maxY - minY);
  return points.map(function (point) {
    return [left + (point[0] - minX) * ratioX, top + (point[1] - minY) * ratioY];
  });
}
/**
 * Get the minimum and maximum points of the points.
 * @memberof OverlapArea
 */

function getMinMaxs(points) {
  var xs = points.map(function (point) {
    return point[0];
  });
  var ys = points.map(function (point) {
    return point[1];
  });
  return {
    minX: Math.min.apply(Math, xs),
    minY: Math.min.apply(Math, ys),
    maxX: Math.max.apply(Math, xs),
    maxY: Math.max.apply(Math, ys)
  };
}
/**
 * Whether the point is in shape
 * @param - point pos
 * @param - shape points
 * @param - whether to check except line
 * @memberof OverlapArea
 */

function isInside(pos, points, excludeLine) {
  var x = pos[0],
      y = pos[1];

  var _a = getMinMaxs(points),
      minX = _a.minX,
      maxX = _a.maxX;

  var xLine = [[minX, y], [maxX, y]];
  var xLinearConstants = getLinearConstants(xLine[0], xLine[1]);
  var lines = convertLines(points);
  var intersectionPosInfos = [];
  lines.forEach(function (line) {
    var linearConstants = getLinearConstants(line[0], line[1]);
    var standardPoint = line[0];

    if (isSameConstants(xLinearConstants, linearConstants)) {
      intersectionPosInfos.push({
        pos: pos,
        line: line,
        type: "line"
      });
    } else {
      var xPoints = getPointsOnLines(getIntersectionPointsByConstants(xLinearConstants, linearConstants), [xLine, line]);
      xPoints.forEach(function (point) {
        if (line.some(function (linePoint) {
          return isSamePoint(linePoint, point);
        })) {
          intersectionPosInfos.push({
            pos: point,
            line: line,
            type: "point"
          });
        } else if (tinyThrottle(standardPoint[1] - y) !== 0) {
          intersectionPosInfos.push({
            pos: point,
            line: line,
            type: "intersection"
          });
        }
      });
    }
  });

  if (!excludeLine) {
    // on line
    if (utils.find(intersectionPosInfos, function (p) {
      return p[0] === x;
    })) {
      return true;
    }
  }

  var intersectionCount = 0;
  var xMap = {};
  intersectionPosInfos.forEach(function (_a) {
    var pos = _a.pos,
        type = _a.type,
        line = _a.line;

    if (pos[0] > x) {
      return;
    }

    if (type === "intersection") {
      ++intersectionCount;
    } else if (type === "line") {
      return;
    } else if (type === "point") {
      var point = utils.find(line, function (linePoint) {
        return linePoint[1] !== y;
      });
      var prevValue = xMap[pos[0]];
      var nextValue = point[1] > y ? 1 : -1;

      if (!prevValue) {
        xMap[pos[0]] = nextValue;
      } else if (prevValue !== nextValue) {
        ++intersectionCount;
      }
    }
  });
  return intersectionCount % 2 === 1;
}
/**
 * Get distance from point to constants. [a, b, c] (ax + by + c = 0)
 * @return [a, b, c]
 * @memberof OverlapArea
 */

function getDistanceFromPointToConstants(_a, pos) {
  var a = _a[0],
      b = _a[1],
      c = _a[2];
  return (a * pos[0] + b * pos[1] + c) / (a * a + b * b);
}
/**
 * Get the coefficient of the linear function. [a, b, c] (ax + by + c = 0)
 * @return [a, b, c]
 * @memberof OverlapArea
 */

function getLinearConstants(point1, point2) {
  var x1 = point1[0],
      y1 = point1[1];
  var x2 = point2[0],
      y2 = point2[1]; // ax + by + c = 0
  // [a, b, c]

  var dx = x2 - x1;
  var dy = y2 - y1;

  if (Math.abs(dx) < utils.TINY_NUM) {
    dx = 0;
  }

  if (Math.abs(dy) < utils.TINY_NUM) {
    dy = 0;
  } // b > 0
  // ax + by + c = 0


  var a = 0;
  var b = 0;
  var c = 0;

  if (!dx) {
    if (dy) {
      // -x + 1 = 0
      a = -1;
      c = x1;
    }
  } else if (!dy) {
    // y - 1 = 0
    b = 1;
    c = -y1;
  } else {
    // y = -a(x - x1) + y1
    // ax + y + a * x1 - y1 = 0
    a = -dy / dx;
    b = 1;
    c = -a * x1 - y1;
  }

  return [a, b, c];
}
/**
 * Get intersection points with linear functions.
 * @memberof OverlapArea
 */

function getIntersectionPointsByConstants(linearConstants1, linearConstants2) {
  var a1 = linearConstants1[0],
      b1 = linearConstants1[1],
      c1 = linearConstants1[2];
  var a2 = linearConstants2[0],
      b2 = linearConstants2[1],
      c2 = linearConstants2[2];
  var isZeroA = a1 === 0 && a2 === 0;
  var isZeroB = b1 === 0 && b2 === 0;
  var results = [];

  if (isZeroA && isZeroB) {
    return [];
  } else if (isZeroA) {
    // b1 * y + c1 = 0
    // b2 * y + c2 = 0
    var y1 = -c1 / b1;
    var y2 = -c2 / b2;

    if (y1 !== y2) {
      return [];
    } else {
      return [[-Infinity, y1], [Infinity, y1]];
    }
  } else if (isZeroB) {
    // a1 * x + c1 = 0
    // a2 * x + c2 = 0
    var x1 = -c1 / a1;
    var x2 = -c2 / a2;

    if (x1 !== x2) {
      return [];
    } else {
      return [[x1, -Infinity], [x1, Infinity]];
    }
  } else if (a1 === 0) {
    // b1 * y + c1 = 0
    // y = - c1 / b1;
    // a2 * x + b2 * y + c2 = 0
    var y = -c1 / b1;
    var x = -(b2 * y + c2) / a2;
    results = [[x, y]];
  } else if (a2 === 0) {
    // b2 * y + c2 = 0
    // y = - c2 / b2;
    // a1 * x + b1 * y + c1 = 0
    var y = -c2 / b2;
    var x = -(b1 * y + c1) / a1;
    results = [[x, y]];
  } else if (b1 === 0) {
    // a1 * x + c1 = 0
    // x = - c1 / a1;
    // a2 * x + b2 * y + c2 = 0
    var x = -c1 / a1;
    var y = -(a2 * x + c2) / b2;
    results = [[x, y]];
  } else if (b2 === 0) {
    // a2 * x + c2 = 0
    // x = - c2 / a2;
    // a1 * x + b1 * y + c1 = 0
    var x = -c2 / a2;
    var y = -(a1 * x + c1) / b1;
    results = [[x, y]];
  } else {
    // a1 * x + b1 * y + c1 = 0
    // a2 * x + b2 * y + c2 = 0
    // b2 * a1 * x + b2 * b1 * y + b2 * c1 = 0
    // b1 * a2 * x + b1 * b2 * y + b1 * c2 = 0
    // (b2 * a1 - b1 * a2)  * x = (b1 * c2 - b2 * c1)
    var x = (b1 * c2 - b2 * c1) / (b2 * a1 - b1 * a2);
    var y = -(a1 * x + c1) / b1;
    results = [[x, y]];
  }

  return results.map(function (result) {
    return [result[0], result[1]];
  });
}
/**
 * Get intersection points to the two lines.
 * @memberof OverlapArea
 */

function getIntersectionPoints(line1, line2, isLimit) {
  var points = getIntersectionPointsByConstants(getLinearConstants(line1[0], line1[1]), getLinearConstants(line2[0], line2[1]));

  if (isLimit) {
    return getPointsOnLines(points, [line1, line2]);
  }

  return points;
}
function isPointOnLine(pos, line) {
  var linearConstants = getLinearConstants(line[0], line[1]);
  return tinyThrottle(getDistanceFromPointToConstants(linearConstants, pos)) === 0;
}
/**
 * Get the points on the lines (between two points).
 * @memberof OverlapArea
 */

function getPointsOnLines(points, lines) {
  var minMaxs = lines.map(function (line) {
    return [0, 1].map(function (order) {
      return [Math.min(line[0][order], line[1][order]), Math.max(line[0][order], line[1][order])];
    });
  });
  var results = [];

  if (points.length === 2) {
    var _a = points[0],
        x = _a[0],
        y = _a[1];

    if (!tinyThrottle(x - points[1][0])) {
      /// Math.max(minY1, minY2)
      var top = Math.max.apply(Math, minMaxs.map(function (minMax) {
        return minMax[1][0];
      })); /// Math.min(maxY1, miax2)

      var bottom = Math.min.apply(Math, minMaxs.map(function (minMax) {
        return minMax[1][1];
      }));

      if (tinyThrottle(top - bottom) > 0) {
        return [];
      }

      results = [[x, top], [x, bottom]];
    } else if (!tinyThrottle(y - points[1][1])) {
      /// Math.max(minY1, minY2)
      var left = Math.max.apply(Math, minMaxs.map(function (minMax) {
        return minMax[0][0];
      })); /// Math.min(maxY1, miax2)

      var right = Math.min.apply(Math, minMaxs.map(function (minMax) {
        return minMax[0][1];
      }));

      if (tinyThrottle(left - right) > 0) {
        return [];
      }

      results = [[left, y], [right, y]];
    }
  }

  if (!results.length) {
    results = points.filter(function (point) {
      var pointX = point[0],
          pointY = point[1];
      return minMaxs.every(function (minMax) {
        return 0 <= tinyThrottle(pointX - minMax[0][0]) && 0 <= tinyThrottle(minMax[0][1] - pointX) && 0 <= tinyThrottle(pointY - minMax[1][0]) && 0 <= tinyThrottle(minMax[1][1] - pointY);
      });
    });
  }

  return results.map(function (result) {
    return [tinyThrottle(result[0]), tinyThrottle(result[1])];
  });
}
/**
* Convert two points into lines.
* @function
* @memberof OverlapArea
*/

function convertLines(points) {
  return __spreadArrays(points.slice(1), [points[0]]).map(function (point, i) {
    return [points[i], point];
  });
}

function getOverlapPointInfos(points1, points2) {
  var targetPoints1 = points1.slice();
  var targetPoints2 = points2.slice();

  if (utils.getShapeDirection(targetPoints1) === -1) {
    targetPoints1.reverse();
  }

  if (utils.getShapeDirection(targetPoints2) === -1) {
    targetPoints2.reverse();
  }

  var lines1 = convertLines(targetPoints1);
  var lines2 = convertLines(targetPoints2);
  var linearConstantsList1 = lines1.map(function (line1) {
    return getLinearConstants(line1[0], line1[1]);
  });
  var linearConstantsList2 = lines2.map(function (line2) {
    return getLinearConstants(line2[0], line2[1]);
  });
  var overlapInfos = [];
  linearConstantsList1.forEach(function (linearConstants1, i) {
    var line1 = lines1[i];
    var linePointInfos = [];
    linearConstantsList2.forEach(function (linearConstants2, j) {
      var intersectionPoints = getIntersectionPointsByConstants(linearConstants1, linearConstants2);
      var points = getPointsOnLines(intersectionPoints, [line1, lines2[j]]);
      linePointInfos.push.apply(linePointInfos, points.map(function (pos) {
        return {
          index1: i,
          index2: j,
          pos: pos,
          type: "intersection"
        };
      }));
    });
    linePointInfos.sort(function (a, b) {
      return utils.getDist(line1[0], a.pos) - utils.getDist(line1[0], b.pos);
    });
    overlapInfos.push.apply(overlapInfos, linePointInfos);

    if (isInside(line1[1], targetPoints2)) {
      overlapInfos.push({
        index1: i,
        index2: -1,
        pos: line1[1],
        type: "inside"
      });
    }
  });
  lines2.forEach(function (line2, i) {
    if (!isInside(line2[1], targetPoints1)) {
      return;
    }

    var isNext = false;
    var index = utils.findIndex(overlapInfos, function (_a) {
      var index2 = _a.index2;

      if (index2 === i) {
        isNext = true;
        return false;
      }

      if (isNext) {
        return true;
      }

      return false;
    });

    if (index === -1) {
      isNext = false;
      index = utils.findIndex(overlapInfos, function (_a) {
        var index1 = _a.index1,
            index2 = _a.index2;

        if (index1 === -1 && index2 + 1 === i) {
          isNext = true;
          return false;
        }

        if (isNext) {
          return true;
        }

        return false;
      });
    }

    if (index === -1) {
      overlapInfos.push({
        index1: -1,
        index2: i,
        pos: line2[1],
        type: "inside"
      });
    } else {
      overlapInfos.splice(index, 0, {
        index1: -1,
        index2: i,
        pos: line2[1],
        type: "inside"
      });
    }
  });
  var pointMap = {};
  return overlapInfos.filter(function (_a) {
    var pos = _a.pos;
    var key = pos[0] + "x" + pos[1];

    if (pointMap[key]) {
      return false;
    }

    pointMap[key] = true;
    return true;
  });
}
/**
* Get the points of the overlapped part of two shapes.
* @function
* @memberof OverlapArea
*/


function getOverlapPoints(points1, points2) {
  var infos = getOverlapPointInfos(points1, points2);
  return infos.map(function (_a) {
    var pos = _a.pos;
    return pos;
  });
}

function isConnectedLine(line) {
  var _a = line[0],
      prevIndex1 = _a.index1,
      prevIndex2 = _a.index2,
      _b = line[1],
      nextIndex1 = _b.index1,
      nextIndex2 = _b.index2;

  if (prevIndex1 !== -1) {
    // same line
    if (prevIndex1 === nextIndex1) {
      return true;
    }

    if (prevIndex1 + 1 === nextIndex1) {
      return true;
    }
  }

  if (prevIndex2 !== -1) {
    // same line
    if (prevIndex2 === nextIndex2) {
      return true;
    }

    if (prevIndex2 + 1 === nextIndex2) {
      return true;
    }
  }

  return false;
}
/**
* Get the areas of the overlapped part of two shapes.
* @function
* @memberof OverlapArea
*/


function getOverlapAreas(points1, points2) {
  var infos = getOverlapPointInfos(points1, points2);
  var areas = [];
  var area;
  getOverlapPointInfos(points1, points2).forEach(function (info, i, arr) {
    if (i === 0 || !isConnectedLine([arr[i - 1], info])) {
      area = [info];
      areas.push(area);
    } else {
      area.push(info);
    }
  });
  return areas.map(function (area) {
    return area.map(function (_a) {
      var pos = _a.pos;
      return pos;
    });
  });
}

function findReversedAreas(points1, points2, index, areas) {
  if (index === void 0) {
    index = 0;
  }

  if (areas === void 0) {
    areas = [];
  }

  var isFirst = areas.length === 0;
  var length = points1.length;
  var nextIndex = points1[index] ? index : 0;

  var nextPoints1 = __spreadArrays(points1.slice(nextIndex), points1.slice(0, nextIndex));

  var _loop_1 = function (i) {
    var point1 = nextPoints1[i];

    if (utils.find(points2, function (point2) {
      return point2[0] === point1[0] && point2[1] === point1[1];
    })) {
      return "continue";
    }

    if (areas.some(function (nextArea) {
      return utils.find(nextArea, function (areaPoint) {
        return areaPoint[0] === point1[0] && areaPoint[1] === point1[1];
      });
    })) {
      if (isFirst) {
        return "continue";
      } else {
        return "break";
      }
    }

    var nextArea = void 0;

    if (isFirst) {
      nextArea = [];
      areas.push(nextArea);
    } else {
      nextArea = areas[areas.length - 1];
    }

    nextArea.push(point1);
    var line = [point1, points1[index + 1] || points1[0]];
    var nextPoint2 = points2.filter(function (point2) {
      return isPointOnLine(point2, line);
    }).sort(function (a, b) {
      return utils.getDist(point1, a) - utils.getDist(point1, b);
    })[0];

    if (!nextPoint2) {
      findReversedAreas(nextPoints1, points2, i + 1, areas);
      return "break";
    } else {
      var point2Index = points2.indexOf(nextPoint2);
      findReversedAreas(points2, points1, point2Index, areas);

      if (!isFirst) {
        return "break";
      }
    }
  };

  for (var i = 0; i < length; ++i) {
    var state_1 = _loop_1(i);

    if (state_1 === "break") break;
  }

  return areas;
}

function findConnectedAreas(points1, points2) {
  return findReversedAreas(points1, __spreadArrays(points2).reverse());
}
/**
* Get non-overlapping areas of two shapes based on points1.
* @memberof OverlapArea
*/

function getUnoverlapAreas(points1, points2) {
  if (!points2.length) {
    return [__spreadArrays(points1)];
  }

  var overlapAreas = getOverlapAreas(points1, points2);
  var unoverlapAreas = [points1];
  overlapAreas.forEach(function (overlapArea) {
    var nextOverlapArea = __spreadArrays(overlapArea).reverse();

    unoverlapAreas = flat(unoverlapAreas.map(function (area) {
      var connectedAreas = findReversedAreas(area, nextOverlapArea);
      var firstConnectedArea = connectedAreas[0];

      if (connectedAreas.length === 1 && nextOverlapArea.every(function (point) {
        return firstConnectedArea.indexOf(point) === -1;
      })) {
        var lastPoint_1 = firstConnectedArea[firstConnectedArea.length - 1];

        var firstPoint = __spreadArrays(nextOverlapArea).sort(function (a, b) {
          return utils.getDist(lastPoint_1, a) - utils.getDist(lastPoint_1, b);
        })[0];

        var firstIndex = nextOverlapArea.indexOf(firstPoint);
        firstConnectedArea.push.apply(firstConnectedArea, __spreadArrays(nextOverlapArea.slice(firstIndex), nextOverlapArea.slice(0, firstIndex), [nextOverlapArea[firstIndex], lastPoint_1]));
      }

      return connectedAreas;
    }));
  });
  return unoverlapAreas;
}
/**
* Gets the size of the overlapped part of two shapes.
* @function
* @memberof OverlapArea
*/

function getOverlapSize(points1, points2) {
  var points = getOverlapPoints(points1, points2);
  return getAreaSize(points);
}

exports.convertLines = convertLines;
exports.findConnectedAreas = findConnectedAreas;
exports.fitPoints = fitPoints;
exports.getAreaSize = getAreaSize;
exports.getDistanceFromPointToConstants = getDistanceFromPointToConstants;
exports.getIntersectionPoints = getIntersectionPoints;
exports.getIntersectionPointsByConstants = getIntersectionPointsByConstants;
exports.getLinearConstants = getLinearConstants;
exports.getMinMaxs = getMinMaxs;
exports.getOverlapAreas = getOverlapAreas;
exports.getOverlapPoints = getOverlapPoints;
exports.getOverlapSize = getOverlapSize;
exports.getPointsOnLines = getPointsOnLines;
exports.getUnoverlapAreas = getUnoverlapAreas;
exports.isInside = isInside;
exports.isPointOnLine = isPointOnLine;
//# sourceMappingURL=overlap-area.cjs.js.map
