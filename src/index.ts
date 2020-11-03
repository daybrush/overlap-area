import { sum, findIndex, getShapeDirection, getDist } from "@daybrush/utils";

/**
 * @namespace OverlapArea
 */

/**
 * Gets the size of a shape (polygon) made of points.
 * @memberof OverlapArea
 */
export function getAreaSize(points: number[][]) {
    return Math.abs(sum(points.map((point, i) => {
        const nextPoint = points[i + 1] || points[0];

        return point[0] * nextPoint[1] - nextPoint[0] * point[1];
    }))) / 2;
}
/**
 * Whether the point is in shape
 * @param - point pos
 * @param - shape points
 * @param - whether to check except line
 * @memberof OverlapArea
 */
export function isInside(pos: number[], points: number[][], excludeLine?: boolean) {
    const [x, y] = pos;
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

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

        intersectionXPoints.push(...xPoints);
        intersectionYPoints.push(...yPoints);

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
export function getLinearConstants(point1: number[], point2: number[]) {
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
) {
    const [a1, b1, c1] = linearConstants1;
    const [a2, b2, c2] = linearConstants2;

    if (a1 === 0 && a2 === 0) {
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
    } else if (b1 === 0 && b2 === 0) {
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
) {
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
) {
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
export function convertLines(points: number[][]) {
    return [...points.slice(1), points[0]].map((point, i) => [points[i], point]);
}
/**
* Get the points of the overlapped part of two shapes.
* @function
* @memberof OverlapArea
*/
export function getOverlapPoints(points1: number[][], points2: number[][]) {
    const lines1 = convertLines(points1);
    const lines2 = convertLines(points2);
    const linearConstantss1 = lines1.map(line1 => getLinearConstants(line1[0], line1[1]));
    const linearConstantss2 = lines2.map(line2 => getLinearConstants(line2[0], line2[1]));

    const overlappingPoints: number[][] = [];
    const points2Direction = getShapeDirection(points2);

    lines2.forEach(line2 => {
        if (isInside(line2[1], points1)) {
            overlappingPoints[points2Direction > 0 ? "push" : "unshift"](line2[1]);
        }
    });
    linearConstantss1.forEach((linearConstants1, i) => {
        const line1 = lines1[i];
        const linePoints: number[][] = [];

        linearConstantss2.forEach((linearConstants2, j) => {
            const intersectionPoints = getIntersectionPointsByConstants(linearConstants1, linearConstants2);
            const points = getPointsOnLines(intersectionPoints, [line1, lines2[j]]);

            linePoints.push(...points);
        });
        linePoints.sort((a, b) => {
            return getDist(line1[0], a) - getDist(line1[0], b);
        });
        overlappingPoints.push(...linePoints);
        if (isInside(line1[1], points2)) {
            overlappingPoints.push(line1[1]);
        }
    });
    const pointMap: Record<string, boolean> = {};

    return overlappingPoints.filter(point => {
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
export function getOverlapSize(points1: number[][], points2: number[][]) {
    const points = getOverlapPoints(points1, points2);

    return getAreaSize(points);
}
