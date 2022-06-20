import { getOverlapAreas, getOverlapPoints, getUnoverlapAreas, isInside } from "../../src/index";
import { tinyThrottle } from "../../src/utils";

describe("test overlap-area", () => {
    it("test tinyThrottle", () => {
        expect(tinyThrottle(291.35180065)).toBe(291.3518007);
    })
    it("test isInside", () => {
        expect(isInside([611.5, 291.35180065], [
            [525, 248],
            [648, 248],
            [648, 454],
            [525, 454],
        ])).toBeTruthy();
    });
    it("test getOverlapPoints", () => {
        expect(getOverlapPoints([
            [0, 0],
            [200, 0],
            [200, 200],
            [0, 200],
        ], [
            [150, 200],
            [100, 150],
            [50, 100],
            [100, 50],
        ])).toEqual([
            [150, 200],
            [100, 150],
            [50, 100],
            [100, 50],
        ]);

        expect(getOverlapPoints([
            [611.5, 291.35180065],
            [682.21069375, 362.0625],
            [611.5, 432.77319335],
            [540.78930625, 362.0625],
        ], [
            [525, 248],
            [648, 248],
            [648, 454],
            [525, 454],
        ])).toEqual([
            [648, 327.8518035],
            [648, 396.2731936],
            [611.5, 432.77319335],
            [540.78930625, 362.0625],
            [611.5, 291.35180065],
        ]);
    });
    it("test getOverlapAreas", () => {
        expect(getOverlapAreas([
            [150, 100],
            [200, 50],
            [250, 60],
            [300, 100],
            [250, 160],
            [150, 150],
            [200, 120],
        ], [
            [250, 100],
            [300, 50],
            [350, 60],
            [400, 100],
            [350, 160],
            [220, 150],
            [300, 120],
        ])).toStrictEqual([
            [
                [272.2222222, 77.7777778],
                [300, 100],
                [287.5, 115],
                [250, 100],
            ],
            [
                [275.7575758, 129.0909091],
                [256.0240964, 152.7710843],
                [220, 150]
            ],
        ]);
    })
    it("test getUnOverlapAreas", () => {
        expect(getUnoverlapAreas([
            [150, 100],
            [200, 50],
            [250, 60],
            [300, 100],
            [250, 160],
            [150, 150],
            [200, 120],
        ], [
            [250, 100],
            [300, 50],
            [350, 60],
            [400, 100],
            [350, 160],
            [220, 150],
            [300, 120],
        ])).toStrictEqual([
            [
                [150, 100],
                [200, 50],
                [250, 60],
                [272.2222222, 77.7777778],
                [250, 100],
                [287.5, 115],
                [275.7575758, 129.0909091],
                [220, 150],
                [256.0240964, 152.7710843],
                [250, 160],
                [150, 150],
                [200, 120]
            ],
        ]);
    });
});