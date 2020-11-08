/*
Copyright (c) 2020 Daybrush
name: overlap-area
license: MIT
author: Daybrush
repository: git+https://github.com/daybrush/overlap-area.git
version: 1.0.0
*/
import { sum, findIndex, getShapeDirection, getDist } from '@daybrush/utils';

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

  return Math.abs(sum(points.map(function (point, i) {
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
      minY = _a.minY,
      maxX = _a.maxX,
      maxY = _a.maxY;

  var xLine = [[minX, y], [maxX, y]];
  var yLine = [[x, minY], [x, maxY]];
  var xLinearConstants = getLinearConstants(xLine[0], xLine[1]);
  var yLinearConstants = getLinearConstants(yLine[0], yLine[1]);
  var lines = convertLines(points);
  var intersectionXPoints = [];
  var intersectionYPoints = [];
  lines.forEach(function (line) {
    var linearConstants = getLinearConstants(line[0], line[1]);
    var xPoints = getPointsOnLines(getIntersectionPointsByConstants(xLinearConstants, linearConstants), [xLine, line]);
    var yPoints = getPointsOnLines(getIntersectionPointsByConstants(yLinearConstants, linearConstants), [yLine, line]);

    if (xPoints.length === 1 ? line[0][1] !== y : true) {
      intersectionXPoints.push.apply(intersectionXPoints, xPoints);
    }

    if (yPoints.length === 1 ? line[0][0] !== x : true) {
      intersectionYPoints.push.apply(intersectionYPoints, yPoints);
    }

    if (!linearConstants[0]) {
      intersectionXPoints.push.apply(intersectionXPoints, xPoints);
    }

    if (!linearConstants[1]) {
      intersectionYPoints.push.apply(intersectionYPoints, yPoints);
    }
  });

  if (!excludeLine) {
    if (findIndex(intersectionXPoints, function (p) {
      return p[0] === x;
    }) > -1 || findIndex(intersectionYPoints, function (p) {
      return p[1] === y;
    }) > -1) {
      return true;
    }
  }

  if (intersectionXPoints.filter(function (p) {
    return p[0] > x;
  }).length % 2 && intersectionYPoints.filter(function (p) {
    return p[1] > y;
  }).length % 2) {
    return true;
  }

  return false;
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

  if (x1 === x2 && y1 === y2) {
    return [0, 0, 0];
  }

  if (x1 === x2) {
    // x = x1
    return [1, 0, -x1];
  } else if (y1 === y2) {
    // y = y1
    return [0, 1, -y1];
  } else {
    // x1 + a * y1 + b = 0
    // x2 + a * y2 + b = 0
    // (x1 -x2) + (y1 - y2) * a = 0
    // a = (x2 - x1) / (y1 - y2)
    // x1 + (x2 - x1) / (y1 - y2)
    var a_1 = (x2 - x1) / (y1 - y2);
    var b_1 = -x1 - a_1 * y1;
    return [1, a_1, b_1];
  }
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
    return [[x, y]];
  } else if (a2 === 0) {
    // b2 * y + c2 = 0
    // y = - c2 / b2;
    // a1 * x + b1 * y + c1 = 0
    var y = -c2 / b2;
    var x = -(b1 * y + c1) / a1;
    return [[x, y]];
  } else if (b1 === 0) {
    // a1 * x + c1 = 0
    // x = - c1 / a1;
    // a2 * x + b2 * y + c2 = 0
    var x = -c1 / a1;
    var y = -(a2 * x + c2) / b2;
    return [[x, y]];
  } else if (b2 === 0) {
    // a2 * x + c2 = 0
    // x = - c2 / a2;
    // a1 * x + b1 * y + c1 = 0
    var x = -c2 / a2;
    var y = -(a1 * x + c1) / b1;
    return [[x, y]];
  } else {
    // a1 * x + b1 * y + c1 = 0
    // a2 * x + b2 * y + c2 = 0
    // b2 * a1 * x + b2 * b1 * y + b2 * c1 = 0
    // b1 * a2 * x + b1 * b2 * y + b1 * c2 = 0
    // (b2 * a1 - b1 * a2)  * x = (b1 * c2 - b2 * c1)
    var x = (b1 * c2 - b2 * c1) / (b2 * a1 - b1 * a2);
    var y = -(a1 * x + c1) / b1;
    return [[x, y]];
  }
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

  if (points.length === 2) {
    var _a = points[0],
        x = _a[0],
        y = _a[1];

    if (x === points[1][0]) {
      /// Math.max(minY1, minY2)
      var top = Math.max.apply(Math, minMaxs.map(function (minMax) {
        return minMax[1][0];
      })); /// Math.min(maxY1, miax2)

      var bottom = Math.min.apply(Math, minMaxs.map(function (minMax) {
        return minMax[1][1];
      }));

      if (top > bottom) {
        return [];
      }

      return [[x, top], [x, bottom]];
    } else if (y === points[1][1]) {
      /// Math.max(minY1, minY2)
      var left = Math.max.apply(Math, minMaxs.map(function (minMax) {
        return minMax[0][0];
      })); /// Math.min(maxY1, miax2)

      var right = Math.min.apply(Math, minMaxs.map(function (minMax) {
        return minMax[0][1];
      }));

      if (left > right) {
        return [];
      }

      return [[left, y], [right, y]];
    }
  }

  return points.filter(function (point) {
    return minMaxs.every(function (minMax) {
      return minMax[0][0] <= point[0] && point[0] <= minMax[0][1] && minMax[1][0] <= point[1] && point[1] <= minMax[1][1];
    });
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
/**
* Get the points of the overlapped part of two shapes.
* @function
* @memberof OverlapArea
*/

function getOverlapPoints(points1, points2) {
  var targetPoints1 = points1.slice();
  var targetPoints2 = points2.slice();

  if (getShapeDirection(targetPoints1) === -1) {
    targetPoints1.reverse();
  }

  if (getShapeDirection(targetPoints2) === -1) {
    targetPoints2.reverse();
  }

  var lines1 = convertLines(targetPoints1);
  var lines2 = convertLines(targetPoints2);
  var linearConstantss1 = lines1.map(function (line1) {
    return getLinearConstants(line1[0], line1[1]);
  });
  var linearConstantss2 = lines2.map(function (line2) {
    return getLinearConstants(line2[0], line2[1]);
  });
  var overlapInfos = [];
  linearConstantss1.forEach(function (linearConstants1, i) {
    var line1 = lines1[i];
    var linePointInfos = [];
    linearConstantss2.forEach(function (linearConstants2, j) {
      var intersectionPoints = getIntersectionPointsByConstants(linearConstants1, linearConstants2);
      var points = getPointsOnLines(intersectionPoints, [line1, lines2[j]]);
      linePointInfos.push.apply(linePointInfos, points.map(function (pos) {
        return {
          index1: i,
          index2: j,
          pos: pos
        };
      }));
    });
    linePointInfos.sort(function (a, b) {
      return getDist(line1[0], a.pos) - getDist(line1[0], b.pos);
    });
    overlapInfos.push.apply(overlapInfos, linePointInfos);

    if (isInside(line1[1], targetPoints2)) {
      overlapInfos.push({
        index1: i,
        index2: -1,
        pos: line1[1]
      });
    }
  });
  lines2.forEach(function (line2, i) {
    if (isInside(line2[1], targetPoints1)) {
      var isNext_1 = false;
      var index = findIndex(overlapInfos, function (_a) {
        var index2 = _a.index2;

        if (index2 === i) {
          isNext_1 = true;
          return false;
        }

        if (isNext_1) {
          return true;
        }

        return false;
      });

      if (index === -1) {
        isNext_1 = false;
        index = findIndex(overlapInfos, function (_a) {
          var index1 = _a.index1,
              index2 = _a.index2;

          if (index1 === -1 && index2 + 1 === i) {
            isNext_1 = true;
            return false;
          }

          if (isNext_1) {
            return true;
          }

          return false;
        });
      }

      if (index === -1) {
        overlapInfos.push({
          index1: -1,
          index2: i,
          pos: line2[1]
        });
      } else {
        overlapInfos.splice(index, 0, {
          index1: -1,
          index2: i,
          pos: line2[1]
        });
      }
    }
  }); // console.log(overlapInfos);

  var overlapPoints = overlapInfos.map(function (_a) {
    var pos = _a.pos;
    return pos;
  });
  var pointMap = {};
  return overlapPoints.filter(function (point) {
    var key = point[0] + "x" + point[1];

    if (pointMap[key]) {
      return false;
    }

    pointMap[key] = true;
    return true;
  });
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

export { convertLines, fitPoints, getAreaSize, getIntersectionPoints, getIntersectionPointsByConstants, getLinearConstants, getMinMaxs, getOverlapPoints, getOverlapSize, getPointsOnLines, isInside };
//# sourceMappingURL=overlap-area.esm.js.map
