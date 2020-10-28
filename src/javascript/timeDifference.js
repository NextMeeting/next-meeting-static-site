/*

1m, 34h

1 minute, 34 hours

1m ago, 1m from now

options.amountOnly
options.displayMode = "full" | "short" | "tiny"
options.sign = "none" -> "1 week" | "1 week"
              "math" -> "+ 1 week" | "- 1 week"
              "text" -> "in 1 week" | "1 week ago"

*/


// Matches:
// YYYY-MM-DDTHH:MM
// YYYY-MM-DDTHH:MM:SS
// YYYY-MM-DDTHH:MM:SS+HH:MM
const VALID_DATETIME_STRING_REGEX = /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2})?(\+[0-9]{2}:[0-9]{2})?/


const timePeriods = {
  MINUTE: {
    full: " minute",
    short: " min.",
    tiny: "m"
  },
  HOUR: {
    full: " hour",
    short: " hr.",
    tiny: "h"
  },
  DAY: {
    full: " day",
    short: " d",
    tiny: "d"
  },
  WEEK: {
    full: " week",
    short: " week",
    tiny: "w"
  },
  MONTH: {
    full: " month",
    short: " mo.",
    tiny: "mo."
  },
  YEAR: {
    full: " year",
    short: " yr.",
    tiny: "y"
  }
}

const msInMinute = 60 * 1000;
const msInHour = msInMinute * 60;
const msInDay = msInHour * 24;
const msInWeek = msInDay * 7;
const msInMonth = msInDay * 30;
const msInYear = msInDay * 365;


const TIME_UNITS = [
  {
    unitName: "MINUTE",
    msInUnit: msInMinute,
    nextLargerUnitMs: msInHour,
  },
  {
    unitName: "HOUR",
    msInUnit: msInHour,
    nextLargerUnitMs: msInDay,
  },
  {
    unitName: "DAY",
    msInUnit: msInDay,
    nextLargerUnitMs: msInWeek,
  },
  {
    unitName: "WEEK",
    msInUnit: msInWeek,
    nextLargerUnitMs: msInMonth,
  },
  {
    unitName: "MONTH",
    msInUnit: msInMonth,
    nextLargerUnitMs: msInYear,
  }
];

const defaultOptions = {
  amountOnly: false,
  displayMode: "short"
}


// Takes two `Date`, (or parsable date-strings. Converted with `new Date()`) and an options object
function timeDifference(current, previous, options) {
  //console.log(`timeDifference ${current} ${previous} ${JSON.stringify(options)}`);
  
  if(!(current instanceof Date)) {
    //if(!current.match(VALID_DATETIME_STRING_REGEX)) throw "Invalid datetime string \"" + current + "\"";
    current = new Date(current);
  }
  if(!(previous instanceof Date)) {
    //if(!previous.match(VALID_DATETIME_STRING_REGEX)) throw "Invalid datetime string \"" + previous +  "\"";
    previous = new Date(previous);
  }

  const displayOptions = {
    ...defaultOptions,
    ...options
  }

  let isFuture = (current - previous) < 0;
  const isPast = !isFuture;

  let elapsedMs = Math.abs(current - previous);
  let amountAndUnit;
  
  if (elapsedMs < msInMinute) return "Just now";

  for (var timeUnit of TIME_UNITS) {
    if(elapsedMs < timeUnit.nextLargerUnitMs) {
      amountAndUnit = toHumanReadableString(elapsedMs / timeUnit.msInUnit, timeUnit.unitName, displayOptions);
      break;
    }
  }

  if(!amountAndUnit) {
    amountAndUnit = toHumanReadableString(elapsedMs/msInYear, "YEAR", displayOptions);
  }

  if(displayOptions.amountOnly) {
    return amountAndUnit;
  }

  const hasMathSign = displayOptions.sign === 'math';
  const hasTextSign = displayOptions.sign === 'text';

  const mathSign = hasMathSign ? (isPast ? "-" : "+") : "";
  const textPastSign = hasTextSign && isPast ? " ago" : "";
  const textFutureSign = hasTextSign && isFuture ? "in " : "";

  return textFutureSign + mathSign + amountAndUnit + textPastSign
}


function toHumanReadableString(amount, unit, displayOptions) {
  amount = Math.round(amount)
  const isPlural = (amount > 1) && (displayOptions.displayMode === "full");

  const formattedUnit = timePeriods[unit][displayOptions.displayMode] + (isPlural ? "s" : "");
  return amount + formattedUnit;
}

window.timeDifference = timeDifference;