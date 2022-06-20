import { sum, findIndex, getShapeDirection, getDist, throttle, TINY_NUM, find } from "@daybrush/utils";
import { OverlapPointInfo, PointInfo, Rect } from "./types";
import { flat, isSameConstants, isSamePoint, tinyThrottle } from "./utils";

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
        maxX,
    } = getMinMaxs(points);

    const xLine = [[minX, y], [maxX, y]];
    const xLinearConstants = getLinearConstants(xLine[0], xLine[1]);
    const lines = convertLines(points);

    interface IntersectionPosInfo {
        pos: number[];
        line: number[][];
        type: "intersection" | "point" | "line";
    }
    const intersectionPosInfos: IntersectionPosInfo[] = [];

    lines.forEach(line => {
        const linearConstants = getLinearConstants(line[0], line[1]);
        const standardPoint = line[0];

        if (isSameConstants(xLinearConstants, linearConstants)) {
            intersectionPosInfos.push({
                pos: pos,
                line,
                type: "line",
            });
        } else {
            const xPoints = getPointsOnLines(getIntersectionPointsByConstants(xLinearConstants, linearConstants), [xLine, line]);

            xPoints.forEach(point => {
                if (line.some(linePoint => isSamePoint(linePoint, point))) {
                    intersectionPosInfos.push({
                        pos: point,
                        line,
                        type: "point",
                    });
                } else if (tinyThrottle(standardPoint[1] - y) !== 0) {
                    intersectionPosInfos.push({
                        pos: point,
                        line,
                        type: "intersection",
                    });
                }
            })
        }
    });

    if (!excludeLine) {
        // on line
        if (find(intersectionPosInfos, p => p[0] === x)) {
            return true;
        }
    }
    let intersectionCount = 0;
    const xMap = {};

    intersectionPosInfos.forEach(({ pos, type, line }) => {
        if (pos[0] > x) {
            return;
        }
        if (type === "intersection") {
            ++intersectionCount;
        } else if (type === "line") {
            return;
        } else if (type === "point") {
            const point = find(line, linePoint => linePoint[1] !== y);
            const prevValue = xMap[pos[0]];
            const nextValue = point[1] > y ? 1 : -1;

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
export function getDistanceFromPointToConstants(
    [a, b, c]: [number, number, number],
    pos: number[],
) {
    return (a * pos[0] + b * pos[1] + c) / (a * a + b * b);
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
    let dx = x2 - x1;
    let dy = y2 - y1;

    if (Math.abs(dx) < TINY_NUM) {
        dx = 0;
    }
    if (Math.abs(dy) < TINY_NUM) {
        dy = 0;
    }

    // b > 0
    // ax + by + c = 0
    let a = 0;
    let b = 0;
    let c = 0;
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

    return [a, b, c] as [number, number, number];
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
    let results: number[][] = [];

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

        results = [[x, y]];
    } else if (a2 === 0) {
        // b2 * y + c2 = 0
        // y = - c2 / b2;
        // a1 * x + b1 * y + c1 = 0
        const y = -c2 / b2;
        const x = -(b1 * y + c1) / a1;

        results = [[x, y]];
    } else if (b1 === 0) {
        // a1 * x + c1 = 0
        // x = - c1 / a1;
        // a2 * x + b2 * y + c2 = 0
        const x = - c1 / a1;
        const y = -(a2 * x + c2) / b2;

        results = [[x, y]];
    } else if (b2 === 0) {
        // a2 * x + c2 = 0
        // x = - c2 / a2;
        // a1 * x + b1 * y + c1 = 0
        const x = - c2 / a2;
        const y = -(a1 * x + c1) / b1;

        results = [[x, y]];
    } else {
        // a1 * x + b1 * y + c1 = 0
        // a2 * x + b2 * y + c2 = 0
        // b2 * a1 * x + b2 * b1 * y + b2 * c1 = 0
        // b1 * a2 * x + b1 * b2 * y + b1 * c2 = 0
        // (b2 * a1 - b1 * a2)  * x = (b1 * c2 - b2 * c1)
        const x = (b1 * c2 - b2 * c1) / (b2 * a1 - b1 * a2);
        const y = -(a1 * x + c1) / b1;

        results = [[x, y]];
    }

    return results.map(result => [result[0], result[1]]);
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

export function isPointOnLine(
    pos: number[],
    line: number[][],
) {
    const linearConstants = getLinearConstants(line[0], line[1]);

    return tinyThrottle(getDistanceFromPointToConstants(linearConstants, pos)) === 0;
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
    let results: number[][] = [];

    if (points.length === 2) {
        const [x, y] = points[0];
        if (!tinyThrottle(x - points[1][0])) {
            /// Math.max(minY1, minY2)
            const top = Math.max(...minMaxs.map(minMax => minMax[1][0]));
            /// Math.min(maxY1, miax2)
            const bottom = Math.min(...minMaxs.map(minMax => minMax[1][1]));

            if (tinyThrottle(top - bottom) > 0) {
                return [];
            }
            results = [
                [x, top],
                [x, bottom],
            ];
        } else if (!tinyThrottle(y - points[1][1])) {
            /// Math.max(minY1, minY2)
            const left = Math.max(...minMaxs.map(minMax => minMax[0][0]));
            /// Math.min(maxY1, miax2)
            const right = Math.min(...minMaxs.map(minMax => minMax[0][1]));

            if (tinyThrottle(left - right) > 0) {
                return [];
            }
            results = [
                [left, y],
                [right, y],
            ];
        }
    }

    if (!results.length) {
        results = points.filter(point => {
            const [pointX, pointY] = point;

            return minMaxs.every(minMax => {
                return (0 <= tinyThrottle(pointX - minMax[0][0]) && 0 <= tinyThrottle(minMax[0][1] - pointX))
                && (0 <= tinyThrottle(pointY - minMax[1][0]) && 0 <= tinyThrottle(minMax[1][1] - pointY));
            });
        });
    }

    return results.map(result => [tinyThrottle(result[0]), tinyThrottle(result[1])]);

}
/**
* Convert two points into lines.
* @function
* @memberof OverlapArea
*/
export function convertLines(points: number[][]): number[][][] {
    return [...points.slice(1), points[0]].map((point, i) => [points[i], point]);
}

function getOverlapPointInfos(points1: number[][], points2: number[][]): OverlapPointInfo[] {
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
    const linearConstantsList1 = lines1.map(line1 => getLinearConstants(line1[0], line1[1]));
    const linearConstantsList2 = lines2.map(line2 => getLinearConstants(line2[0], line2[1]));

    const overlapInfos: OverlapPointInfo[] = [];

    linearConstantsList1.forEach((linearConstants1, i) => {
        const line1 = lines1[i];
        const linePointInfos: OverlapPointInfo[] = [];
        linearConstantsList2.forEach((linearConstants2, j) => {
            const intersectionPoints = getIntersectionPointsByConstants(linearConstants1, linearConstants2);
            const points = getPointsOnLines(intersectionPoints, [line1, lines2[j]]);

            linePointInfos.push(...points.map(pos => ({
                index1: i,
                index2: j,
                pos,
                type: "intersection" as const,
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
                type: "inside" as const,
            });
        }
    });

    lines2.forEach((line2, i) => {
        if (!isInside(line2[1], targetPoints1)) {
            return;
        }
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
                type: "inside" as const,
            });
        } else {
            overlapInfos.splice(index, 0, {
                index1: -1,
                index2: i,
                pos: line2[1],
                type: "inside" as const,
            });

        }
    });
    const pointMap: Record<string, boolean> = {};

    return overlapInfos.filter(({ pos }) => {
        const key = `${pos[0]}x${pos[1]}`;

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
export function getOverlapPoints(points1: number[][], points2: number[][]): number[][] {
    const infos = getOverlapPointInfos(points1, points2);

    return infos.map(({ pos }) => pos);
}

function isConnectedLine(line: OverlapPointInfo[]) {
    const {
        0: {
            index1: prevIndex1,
            index2: prevIndex2,
        },
        1: {
            index1: nextIndex1,
            index2: nextIndex2,
        }
    } = line;

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
export function getOverlapAreas(points1: number[][], points2: number[][]): number[][][] {
    const infos = getOverlapPointInfos(points1, points2);
    const areas: OverlapPointInfo[][] = [];
    let area: OverlapPointInfo[];

    getOverlapPointInfos(points1, points2).forEach((info, i, arr) => {
        if (i === 0 || !isConnectedLine([arr[i - 1], info])) {
            area = [info];
            areas.push(area);
        } else {
            area.push(info);
        }
    });

    return areas.map(area => area.map(({ pos }) => pos));
}
function findReversedAreas(points1: number[][], points2: number[][], index: number = 0, areas: number[][][] = []): number[][][] {
    const isFirst = areas.length === 0;
    const length = points1.length;
    const nextIndex = points1[index] ? index : 0;
    const nextPoints1 = [...points1.slice(nextIndex), ...points1.slice(0, nextIndex)];

    for (let i = 0; i < length; ++i) {
        const point1 = nextPoints1[i];

        if (find(points2, point2 => point2[0] === point1[0] && point2[1] === point1[1])) {
            continue;
        }
        if (areas.some(nextArea => find(nextArea, areaPoint => areaPoint[0] === point1[0] && areaPoint[1] === point1[1]))) {
            if (isFirst) {
                continue;
            } else {
                break;
            }
        }
        let nextArea: number[][];

        if (isFirst) {
            nextArea = [];
            areas.push(nextArea);
        } else {
            nextArea = areas[areas.length - 1];
        }
        nextArea.push(point1);


        const line = [point1, points1[index + 1] || points1[0]];
        const nextPoint2 = points2.filter(point2 => {
            return isPointOnLine(point2, line);
        }).sort((a, b) => {
            return getDist(point1, a) - getDist(point1, b);
        })[0];

        if (!nextPoint2) {
            findReversedAreas(nextPoints1, points2, i + 1, areas);
            break;
        } else {
            const point2Index = points2.indexOf(nextPoint2);

            findReversedAreas(points2, points1, point2Index, areas);
            if (!isFirst) {
                break;
            }
        }
    }
    return areas;
}
export function findConnectedAreas(points1: number[][], points2: number[][]) {
    return findReversedAreas(points1, [...points2].reverse());
}
/**
* Get non-overlapping areas of two shapes based on points1.
* @memberof OverlapArea
*/
export function getUnoverlapAreas(points1: number[][], points2: number[][]): number[][][] {
    if (!points2.length) {
        return [[...points1]];
    }
    const overlapAreas = getOverlapAreas(points1, points2);
     let unoverlapAreas = [points1];

    overlapAreas.forEach(overlapArea => {
        const nextOverlapArea = [...overlapArea].reverse();

        unoverlapAreas = flat(unoverlapAreas.map(area => {
            const connectedAreas = findReversedAreas(area, nextOverlapArea);
            const firstConnectedArea = connectedAreas[0];

            if (connectedAreas.length === 1 && nextOverlapArea.every(point => firstConnectedArea.indexOf(point) === -1)) {
                const lastPoint = firstConnectedArea[firstConnectedArea.length - 1];
                const firstPoint = [...nextOverlapArea].sort((a, b) => {
                    return getDist(lastPoint, a) - getDist(lastPoint, b);
                })[0];
                const firstIndex = nextOverlapArea.indexOf(firstPoint);

                firstConnectedArea.push(
                    ...nextOverlapArea.slice(firstIndex),
                    ...nextOverlapArea.slice(0, firstIndex),
                    nextOverlapArea[firstIndex],
                    lastPoint,
                );
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
export function getOverlapSize(points1: number[][], points2: number[][]): number {
    const points = getOverlapPoints(points1, points2);

    return getAreaSize(points);
}
