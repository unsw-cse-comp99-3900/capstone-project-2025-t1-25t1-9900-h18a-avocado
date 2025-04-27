// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
// global.TextDecoder = TextDecoder;
// src/setupTests.js
Object.defineProperty(global.HTMLCanvasElement.prototype, 'getContext', {
    value: (type) => {
      if (type === '2d') {
        // 返回一个假的 2D context 对象，避免 chart.js 报错
        return {
          fillRect: () => {},
          clearRect: () => {},
          getImageData: () => ({ data: [] }),
          putImageData: () => {},
          createImageData: () => [],
          setTransform: () => {},
          drawImage: () => {},
          save: () => {},
          fillText: () => {},
          restore: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          closePath: () => {},
          stroke: () => {},
          translate: () => {},
          scale: () => {},
          rotate: () => {},
          arc: () => {},
          fill: () => {},
          measureText: () => ({ width: 0 }),
          transform: () => {},
          rect: () => {},
          clip: () => {},
        };
      }
      // 如果请求别的 context，比如 webgl，返回 null
      return null;
    },
  });