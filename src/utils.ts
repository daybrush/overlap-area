import { throttle, TINY_NUM } from "@daybrush/utils";

export function tinyThrottle(num: number) {
    return throttle(num, TINY_NUM);
}

export function isSameConstants(
    linearConstants1: number[],
    linearConstants2: number[],
) {
    return linearConstants1.every((v, i) => tinyThrottle(v - linearConstants2[i]) === 0);
}

export function isSamePoint(
    point1: number[],
    point2: number[],
) {
    return !tinyThrottle(point1[0] - point2[0]) && !tinyThrottle(point1[1] - point2[1]);
}

export function flat<Type extends any>(arr: Type[][]): Type[] {
    return arr.reduce<Type[]>((prev, current) => {
        prev.push(...current);
        return prev;
    }, []);
}
