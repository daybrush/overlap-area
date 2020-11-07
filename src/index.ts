import { sum, findIndex, getShapeDirection, getDist } from "@daybrush/utils";
import { PointInfo, Rect } from "./types";

/**
 * @namespace OverlapArea
 */

/**
 * Gets the size of a shape (polygon) made of points.
 * @memberof OverlapArea
 */
export function getAreaSize(points: number[][]): number {
    if (points.length < 3) {
        return 0;
    }
    return Math.abs(sum(points.map((point, i) => {
        const nextPoint = points[i + 1] || points[0];

        return point[0] * nextPoint[1] - nextPoint[0] * point[1];
    }))) / 2;
}


/**
 * Get points that fit the rect,
 * @memberof OverlapArea
 */
export function fitPoints(points: number[][], rect: Rect): number[][] {
    const { width, height, left, top } = rect;
    const { minX, minY, maxX, maxY } = getMinMaxs(points);
    const ratioX = width / (maxX - minX);
    const ratioY = height / (maxY - minY);

    return points.map(point => {
        return [
            left + (point[0] - minX) * ratioX,
            top + (point[1] - minY) * ratioY,
        ];
    });
}
/**
 * Get the minimum and maximum points of the points.
 * @memberof OverlapArea
 */
export function getMinMaxs(points: number[][]): { minX: number, minY: number, maxX: number, maxY: number } {
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);

    return {
        minX: Math.min(...xs),
        minY: Math.min(...ys),
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
    };
}
/**
 * Whether the point is in shape
 * @param - point pos
 * @param - shape points
 * @param - whether to check except line
 * @memberof OverlapArea
 */
export function isInside(pos: number[], points: number[][], excludeLine?: boolean): boolean {
    const [x, y] = pos;
    const {
        minX,
        minY,
        maxX,
        maxY,
    } = getMinMaxs(points);

    const xLine = [[minX, y], [maxX, y]];
    const yLine = [[x, minY], [x, maxY]];
    const xLinearConstants = getLinearConstants(xLine[0], xLine[1]);
    const yLinearConstants = getLinearConstants(yLine[0], yLine[1]);
    const lines = convertLines(points);
    const intersectionXPoints: number[][] = [];
    const intersectionYPoints: number[][] = [];

    lines.forEach(line => {
        const linearConstants = getLinearConstants(line[0], line[1]);
        const xPoints = getPointsOnLines(getIntersectionPointsByConstants(xLinearConstants, linearConstants), [xLine, line]);
        const yPoints = getPointsOnLines(getIntersectionPointsByConstants(yLinearConstants, linearConstants), [yLine, line]);

        if (xPoints.length === 1 ? line[0][1] !== y : true) {
            intersectionXPoints.push(...xPoints);
        }
        if (yPoints.length === 1 ? line[0][0] !== x : true) {
            intersectionYPoints.push(...yPoints);
        }

        if (!linearConstants[0]) {
            intersectionXPoints.push(...xPoints);
        }
        if (!linearConstants[1]) {
            intersectionYPoints.push(...yPoints);
        }
    });

    if (!excludeLine) {
        if (
            findIndex(intersectionXPoints, p => p[0] === x) > -1
            || findIndex(intersectionYPoints, p => p[1] === y) > -1
        ) {
            return true;
        }
    }
    if (
        (intersectionXPoints.filter(p => p[0] > x).length % 2)
        && (intersectionYPoints.filter(p => p[1] > y).length % 2)
    ) {
        return true;
    }
    return false;
}

/**
 * Get the coefficient of the linear function. [a, b, c] (ax + by + c = 0)
 * @return [a, b, c]
 * @memberof OverlapArea
 */
export function getLinearConstants(point1: number[], point2: number[]): [number, number, number] {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    // ax + by + c = 0
    // [a, b, c]
    let a = 0;
    let b = 0;
    let c = 0;

    if (x1 === x2 && y1 === y2) {
        return [0, 0, 0];
    } if (x1 === x2) {
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

        const a = (x2 - x1) / (y1 - y2);
        const b = -x1 - a * y1;
        return [1, a, b];
    }
}
/**
 * Get intersection points with linear functions.
 * @memberof OverlapArea
 */
export function getIntersectionPointsByConstants(
    linearConstants1: number[],
    linearConstants2: number[],
): number[][] {
    const [a1, b1, c1] = linearConstants1;
    const [a2, b2, c2] = linearConstants2;

    const isZeroA = a1 === 0 && a2 === 0;
    const isZeroB = b1 === 0 && b2 === 0;
    if (isZeroA && isZeroB) {
        return [];
    } else if (isZeroA) {
        // b1 * y + c1 = 0
        // b2 * y + c2 = 0
        const y1 = -c1 / b1;
        const y2 = -c2 / b2;

        if (y1 !== y2) {
            return [];
        } else {
            return [
                [-Infinity, y1],
                [Infinity, y1],
            ];
        }
    } else if (isZeroB) {
        // a1 * x + c1 = 0
        // a2 * x + c2 = 0
        const x1 = -c1 / a1;
        const x2 = -c2 / a2;

        if (x1 !== x2) {
            return [];
        } else {
            return [
                [x1, -Infinity],
                [x1, Infinity],
            ];
        }
    } else if (a1 === 0) {
        // b1 * y + c1 = 0
        // y = - c1 / b1;
        // a2 * x + b2 * y + c2 = 0
        const y = -c1 / b1;
        const x = -(b2 * y + c2) / a2;

        return [[x, y]];
    } else if (a2 === 0) {
        // b2 * y + c2 = 0
        // y = - c2 / b2;
        // a1 * x + b1 * y + c1 = 0
        const y = -c2 / b2;
        const x = -(b1 * y + c1) / a1;

        return [[x, y]];
    } else if (b1 === 0) {
        // a1 * x + c1 = 0
        // x = - c1 / a1;
        // a2 * x + b2 * y + c2 = 0
        const x = - c1 / a1;
        const y = -(a2 * x + c2) / b2;

        return [[x, y]];
    } else if (b2 === 0) {
        // a2 * x + c2 = 0
        // x = - c2 / a2;
        // a1 * x + b1 * y + c1 = 0
        const x = - c2 / a2;
        const y = -(a1 * x + c1) / b1;

        return [[x, y]];
    } else {
        // a1 * x + b1 * y + c1 = 0
        // a2 * x + b2 * y + c2 = 0
        // b2 * a1 * x + b2 * b1 * y + b2 * c1 = 0
        // b1 * a2 * x + b1 * b2 * y + b1 * c2 = 0
        // (b2 * a1 - b1 * a2)  * x = (b1 * c2 - b2 * c1)
        const x = (b1 * c2 - b2 * c1) / (b2 * a1 - b1 * a2);
        const y = -(a1 * x + c1) / b1;

        return [[x, y]];
    }
}
/**
 * Get intersection points to the two lines.
 * @memberof OverlapArea
 */
export function getIntersectionPoints(
    line1: number[][],
    line2: number[][],
    isLimit?: boolean,
): number[][] {
    const points = getIntersectionPointsByConstants(
        getLinearConstants(line1[0], line1[1]),
        getLinearConstants(line2[0], line2[1]),
    );

    if (isLimit) {
        return getPointsOnLines(points, [line1, line2]);
    }
    return points;
}
/**
 * Get the points on the lines (between two points).
 * @memberof OverlapArea
 */
export function getPointsOnLines(
    points: number[][],
    lines: number[][][],
): number[][] {
    const minMaxs = lines.map(line => [0, 1].map(order => [
        Math.min(line[0][order], line[1][order]),
        Math.max(line[0][order], line[1][order]),
    ]));
    if (points.length === 2) {
        const [x, y] = points[0];
        if (x === points[1][0]) {
            /// Math.max(minY1, minY2)
            const top = Math.max(...minMaxs.map(minMax => minMax[1][0]));
            /// Math.min(maxY1, miax2)
            const bottom = Math.min(...minMaxs.map(minMax => minMax[1][1]));

            if (top > bottom) {
                return [];
            }
            return [
                [x, top],
                [x, bottom],
            ];
        } else if (y === points[1][1]) {
            /// Math.max(minY1, minY2)
            const left = Math.max(...minMaxs.map(minMax => minMax[0][0]));
            /// Math.min(maxY1, miax2)
            const right = Math.min(...minMaxs.map(minMax => minMax[0][1]));

            if (left > right) {
                return [];
            }
            return [
                [left, y],
                [right, y],
            ];
        }
    }

    return points.filter(point => {
        return minMaxs.every(minMax => {
            return (minMax[0][0] <= point[0] && point[0] <= minMax[0][1])
                && (minMax[1][0] <= point[1] && point[1] <= minMax[1][1]);
        });
    });

}
/**
* Convert two points into lines.
* @function
* @memberof OverlapArea
*/
export function convertLines(points: number[][]): number[][][] {
    return [...points.slice(1), points[0]].map((point, i) => [points[i], point]);
}
/**
* Get the points of the overlapped part of two shapes.
* @function
* @memberof OverlapArea
*/
export function getOverlapPoints(points1: number[][], points2: number[][]): number[][] {
    const targetPoints1 = points1.slice();
    const targetPoints2 = points2.slice();

    if (getShapeDirection(targetPoints1) === -1) {
        targetPoints1.reverse();
    }
    if (getShapeDirection(targetPoints2) === -1) {
        targetPoints2.reverse();
    }
    const lines1 = convertLines(targetPoints1);
    const lines2 = convertLines(targetPoints2);
    const linearConstantss1 = lines1.map(line1 => getLinearConstants(line1[0], line1[1]));
    const linearConstantss2 = lines2.map(line2 => getLinearConstants(line2[0], line2[1]));

    const overlapInfos: Array<{
        index1: number;
        index2: number;
        pos: number[];
    }> = [];

    linearConstantss1.forEach((linearConstants1, i) => {
        const line1 = lines1[i];
        const linePointInfos: PointInfo[] = [];
        linearConstantss2.forEach((linearConstants2, j) => {
            const intersectionPoints = getIntersectionPointsByConstants(linearConstants1, linearConstants2);
            const points = getPointsOnLines(intersectionPoints, [line1, lines2[j]]);

            linePointInfos.push(...points.map(pos => ({
                index1: i,
                index2: j,
                pos,
            })));
        });
        linePointInfos.sort((a, b) => {
            return getDist(line1[0], a.pos) - getDist(line1[0], b.pos);
        });

        overlapInfos.push(...linePointInfos);

        if (isInside(line1[1], targetPoints2)) {
            overlapInfos.push({
                index1: i,
                index2: -1,
                pos: line1[1],
            });
        }
    });

    lines2.forEach((line2, i) => {
        if (isInside(line2[1], targetPoints1)) {
            let isNext = false;
            let index = findIndex(overlapInfos, ({ index2 }) => {
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
                index = findIndex(overlapInfos, ({ index1, index2 }) => {
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
                });
            } else {
                overlapInfos.splice(index, 0, {
                    index1: -1,
                    index2: i,
                    pos: line2[1],
                });
            }
        }
    });
    // console.log(overlapInfos);
    const overlapPoints = overlapInfos.map(({ pos }) => pos);
    const pointMap: Record<string, boolean> = {};

    return overlapPoints.filter(point => {
        const key = `${point[0]}x${point[1]}`;

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
export function getOverlapSize(points1: number[][], points2: number[][]): number {
    const points = getOverlapPoints(points1, points2);

    return getAreaSize(points);
}
