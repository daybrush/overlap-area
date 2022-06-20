export interface PointInfo {
    index1: number;
    index2: number;
    pos: number[];
}
export interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface OverlapPointInfo {
    index1: number;
    index2: number;
    pos: number[];
    type: "intersection" | "inside";
}
