
import builder from "@daybrush/builder";

export default builder([
    {
        name: "OverlapArea",
        input: "src/index.umd.ts",
        output: "./dist/overlap-area.js",
        resolve: true,
    },
    {
        name: "OverlapArea",
        input: "src/index.umd.ts",
        output: "./dist/overlap-area.min.js",
        resolve: true,
        uglify: true,
    },
    {
        input: "src/index.ts",
        output: "./dist/overlap-area.esm.js",
        exports: "named",
        format: "es",
    },
    {
        input: "src/index.ts",
        output: "./dist/overlap-area.cjs.js",
        exports: "named",
        format: "cjs",
    },
]);
