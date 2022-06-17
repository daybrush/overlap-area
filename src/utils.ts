import { throttle, TINY_NUM } from "@daybrush/utils";

export function tinyThrottle(num: number) {
    return throttle(num, TINY_NUM);
}
