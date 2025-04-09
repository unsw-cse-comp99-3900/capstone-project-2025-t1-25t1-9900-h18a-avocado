// 获取十年段列表（如 [1980, 1990, 2000, 2010]）
function getDecades(startYear, endYear) {
    const decades = [];
    for (let year = startYear; year <= endYear; year += 10) {
      decades.push(year);
    }
    return decades;
  }
  
  // 统计干旱事件频率（按十年：只要事件跨过某年就算入）
  export function getEventFreqByDecade(events, startYear, endYear) {
    const freqByDecade = {};
    const decades = getDecades(startYear, endYear);
  
    decades.forEach((decade) => {
      freqByDecade[decade] = 0;
    });
  
    events.forEach((event) => {
      const sYear = event.start.year;
      const eYear = event.end.year;
      decades.forEach((decade) => {
        const decadeEnd = decade + 9;
        if (eYear >= decade && sYear <= decadeEnd) {
          freqByDecade[decade] += 1;
        }
      });
    });
  
    return Object.values(freqByDecade);
  }
  
  // 统计干旱月份数量（按十年）
  export function getMonthCountByDecade(monthList, startYear, endYear) {
    const result = {};
    const decades = getDecades(startYear, endYear);
  
    decades.forEach((decade) => {
      result[decade] = 0;
    });
  
    monthList.forEach((monthStr) => {
      const year = parseInt(monthStr.split("-")[0]);
      decades.forEach((decade) => {
        const decadeEnd = decade + 9;
        if (year >= decade && year <= decadeEnd) {
          result[decade] += 1;
        }
      });
    });
  
    return Object.values(result);
  }
  