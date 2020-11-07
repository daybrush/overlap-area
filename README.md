
<p align="middle" ><img src="https://raw.githubusercontent.com/daybrush/overlap-area/master/demo/images/logo.png" /></p>
<h2 align="middle">Overlap Area</h2>
<p align="middle">
<a href="https://www.npmjs.com/package/overlap-area" target="_blank"><img src="https://img.shields.io/npm/v/overlap-area.svg?style=flat-square&color=007acc&label=version" alt="npm version" /></a>
<img src="https://img.shields.io/badge/language-typescript-blue.svg?style=flat-square"/>
<a href="https://github.com/daybrush/overlap-area/blob/master/LICENSE" target="_blank"><img src="https://img.shields.io/github/license/daybrush/overlap-area.svg?style=flat-square&label=license&color=08CE5D"/></a>
</p>
<p align="middle">Find the Overlap Area.</p>

<p align="middle">
    <a href="https://daybrush.com/overlap-area" target="_blank"><strong>Demo</strong></a> /
    <a href="https://daybrush.com/overlap-area/release/latest/doc/" target="_blank"><strong>API</strong></a> /
    <a href="https://github.com/daybrush/scena" target="_blank"><strong>Main Project</strong></a>
</p>

## 📄 API Documents
* [API documentation](https://daybrush.com/overlap-area/release/latest/doc/)

## ⚙️ Installation
```bash
$ npm install overlap-area
```

```html
<script src="//daybrush.com/overlap-area/release/latest/dist/overlap-area.min.js"></script>
```

## 🚀 How to use
```ts
import { isInside, getOverlapPoints, getOverlapSize } from "overlap-area";

const points1 = [
    [0, 0],
    [100, 0],
    [120, 100],
    [0, 100],
];
const points2 = [
    [100, 0],
    [150, 0],
    [150, 100],
    [100, 100],
];

// true
console.log(isInside([50, 50], points1));
// false
console.log(isInside([50, 50], points2));

// [100, 0], [120, 100], [100, 100]
console.log(getOverlapPoints(points1, points2));

// 1000
console.log(getOverlapSize(points1, points2));
```

## ⭐️ Show Your Support
Please give a ⭐️ if this project helped you!

## 👏 Contributing

If you have any questions or requests or want to contribute to `overlap-area` or other packages, please write the [issue](https://github.com/daybrush/overlap-area/issues) or give me a Pull Request freely.

**Special thanks to PMY**

## 🐞 Bug Report

If you find a bug, please report to us opening a new [Issue](https://github.com/daybrush/overlap-area/issues) on GitHub.


## 📝 License

This project is [MIT](https://github.com/daybrush/overlap-area/blob/master/LICENSE) licensed.

```
MIT License

Copyright (c) 2020 Daybrush

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```